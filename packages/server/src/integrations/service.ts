import type { ConnectorConfig, Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import type { PlatformEvent } from '../events/eventTypes.js';
import { recordIntegrationExecution } from '../monitoring/telemetry.js';
import { createStructuredLogger } from '../observability/logger.js';
import { logAuditEvent, logIntegrationEvent } from '../services/auditService.js';
import {
  INTEGRATION_EXECUTION_STATUS,
  INTEGRATION_TRIGGER_MODE,
  type IntegrationExecutionContext,
  type IntegrationTriggerMode
} from './integration.js';
import { getIntegrationAdapter, registerDefaultIntegrations } from './registry.js';

function toConfigRecord(value: Prisma.JsonValue): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function createLogger(input: {
  adapterKey: string;
  connectorId: string;
  tenantId: string;
  triggerMode: IntegrationTriggerMode;
}) {
  const logger = createStructuredLogger({
    observability: {
      capabilityId: 'platform.integrations',
      failureType: 'none',
      tenantId: input.tenantId
    },
    serviceName: 'api'
  }).child({
    adapterKey: input.adapterKey,
    capabilityId: 'platform.integrations',
    connectorId: input.connectorId,
    failureType: 'none',
    tenantId: input.tenantId,
    triggerMode: input.triggerMode,
    subsystem: 'integration'
  });

  function log(
    level: 'debug' | 'error' | 'info' | 'warn',
    message: string,
    metadata?: Record<string, unknown>
  ) {
    logger[level](message, metadata);
  }

  return {
    debug(message: string, metadata?: Record<string, unknown>) {
      log('debug', message, metadata);
    },
    error(message: string, metadata?: Record<string, unknown>) {
      log('error', message, {
        failureType: 'integration',
        ...(metadata ?? {})
      });
    },
    info(message: string, metadata?: Record<string, unknown>) {
      log('info', message, metadata);
    },
    warn(message: string, metadata?: Record<string, unknown>) {
      log('warn', message, metadata);
    }
  };
}

function resolveTriggerMode(
  connector: Pick<ConnectorConfig, 'config'>,
  fallbackMode: IntegrationTriggerMode
) {
  const config = toConfigRecord(connector.config as Prisma.JsonValue);
  const trigger = config?.trigger;

  if (typeof trigger === 'object' && trigger !== null && !Array.isArray(trigger)) {
    const triggerRecord = trigger as Record<string, unknown>;

    if (typeof triggerRecord.mode !== 'string') {
      return fallbackMode;
    }

    const mode = triggerRecord.mode.trim().toUpperCase();

    if (mode in INTEGRATION_TRIGGER_MODE) {
      return mode as IntegrationTriggerMode;
    }
  }

  return fallbackMode;
}

async function createExecution(
  connector: Pick<ConnectorConfig, 'id' | 'tenantId' | 'adapterKey' | 'config'>,
  triggerMode: IntegrationTriggerMode,
  event?: PlatformEvent,
  requestedByUserId?: string | null
) {
  const metadata = toConfigRecord(connector.config as Prisma.JsonValue);
  return prisma.integrationExecution.create({
    data: {
      tenantId: connector.tenantId,
      connectorConfigId: connector.id,
      adapterKey: connector.adapterKey,
      triggerMode,
      status: INTEGRATION_EXECUTION_STATUS.RUNNING,
      metadata: {
        eventType: event?.type ?? null,
        requestedByUserId: requestedByUserId ?? null,
        trigger: metadata?.trigger ?? null
      }
    }
  });
}

async function markExecutionFinished(
  executionId: string,
  input: {
    eventsPublished?: number;
    message?: string;
    metadata?: Record<string, unknown>;
    recordsProcessed?: number;
    status: typeof INTEGRATION_EXECUTION_STATUS.FAILED | typeof INTEGRATION_EXECUTION_STATUS.SUCCEEDED;
  },
  tenantId?: string
) {
  const execution =
    tenantId
      ? await prisma.integrationExecution.findFirst({
          where: {
            id: executionId,
            tenantId
          }
        })
      : await prisma.integrationExecution.findFirst({
          where: {
            id: executionId
          }
        });

  if (!execution) {
    throw new Error('Integration execution not found');
  }

  const result = await prisma.integrationExecution.updateMany({
    where: {
      id: executionId,
      tenantId: execution.tenantId
    },
    data: {
      eventsPublished: input.eventsPublished,
      finishedAt: new Date(),
      message: input.message,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      recordsProcessed: input.recordsProcessed,
      status: input.status
    }
  });

  if (result.count === 0) {
    throw new Error('Integration execution not found');
  }

  const updatedExecution = await prisma.integrationExecution.findFirst({
    where: {
      id: executionId,
      tenantId: execution.tenantId
    }
  });

  if (!updatedExecution) {
    throw new Error('Integration execution not found');
  }

  return updatedExecution;
}

export async function executeIntegration(connectorId: string, input: {
  attempt?: number;
  event?: PlatformEvent;
  requestedByUserId?: string | null;
  triggerMode?: IntegrationTriggerMode;
} = {}) {
  registerDefaultIntegrations();

  const connector = await prisma.connectorConfig.findFirst({
    where: {
      id: connectorId
    }
  });

  if (!connector) {
    throw new Error('Connector config not found');
  }

  const adapter = getIntegrationAdapter(connector.adapterKey);

  if (!adapter) {
    throw new Error(`Adapter '${connector.adapterKey}' is not registered`);
  }

  const connectorConfig = toConfigRecord(connector.config as Prisma.JsonValue);

  if (!connectorConfig) {
    throw new Error('Connector config must be an object');
  }

  const triggerMode = resolveTriggerMode(
    connector,
    input.triggerMode ?? INTEGRATION_TRIGGER_MODE.MANUAL
  );
  const logger = createLogger({
    adapterKey: connector.adapterKey,
    connectorId: connector.id,
    tenantId: connector.tenantId,
    triggerMode
  });
  const execution = await createExecution(
    connector,
    triggerMode,
    input.event,
    input.requestedByUserId
  );

  const context: IntegrationExecutionContext = {
    attempt: input.attempt ?? 1,
    audit: {
      record: async (auditInput) => {
        await logIntegrationEvent({
          tenantId: connector.tenantId,
          actorUserId: auditInput.actorUserId ?? input.requestedByUserId ?? null,
          action: auditInput.action,
          resourceType: 'Integration',
          resourceId: connector.id,
          metadata: auditInput.metadata
        });
      }
    },
    event: input.event,
    logger,
    requestedByUserId: input.requestedByUserId,
    tenantId: connector.tenantId,
    triggerMode
  };
  const startedAt = Date.now();

  try {
    const validatedConfig = await adapter.validateConfig({
      ...connectorConfig,
      tenantId: connector.tenantId
    });
    const result = await adapter.sync(
      validatedConfig as Record<string, unknown>,
      context
    );

    if (!result.ok) {
      throw new Error(result.message ?? 'Integration sync failed');
    }

    const connectorUpdateResult = await prisma.connectorConfig.updateMany({
      where: {
        id: connector.id,
        tenantId: connector.tenantId
      },
      data: {
        status: 'ACTIVE',
        lastSyncAt: new Date()
      }
    });

    if (connectorUpdateResult.count === 0) {
      throw new Error('Connector config not found');
    }

    const updatedConnector = await prisma.connectorConfig.findFirst({
      where: {
        id: connector.id,
        tenantId: connector.tenantId
      }
    });

    if (!updatedConnector) {
      throw new Error('Connector config not found');
    }

    await markExecutionFinished(execution.id, {
      eventsPublished: result.eventsPublished,
      message: result.message,
      metadata: result.metadata,
      recordsProcessed: result.recordsProcessed,
      status: INTEGRATION_EXECUTION_STATUS.SUCCEEDED
    }, connector.tenantId);

    await logAuditEvent({
      tenantId: connector.tenantId,
      actorUserId: input.requestedByUserId ?? null,
      action: 'integration.execution.succeeded',
      entityType: 'Integration',
      entityId: connector.id,
      metadata: {
        adapterKey: connector.adapterKey,
        executionId: execution.id,
        triggerMode
      }
    });

    recordIntegrationExecution({
      adapterKey: connector.adapterKey,
      durationMs: Date.now() - startedAt,
      status: INTEGRATION_EXECUTION_STATUS.SUCCEEDED,
      triggerMode
    });

    return {
      connector: updatedConnector,
      executionId: execution.id,
      result
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown integration failure';

    await markExecutionFinished(execution.id, {
      message,
      status: INTEGRATION_EXECUTION_STATUS.FAILED
    }, connector.tenantId);

    await logAuditEvent({
      tenantId: connector.tenantId,
      actorUserId: input.requestedByUserId ?? null,
      action: 'integration.execution.failed',
      entityType: 'Integration',
      entityId: connector.id,
      metadata: {
        adapterKey: connector.adapterKey,
        executionId: execution.id,
        triggerMode
      }
    });

    recordIntegrationExecution({
      adapterKey: connector.adapterKey,
      durationMs: Date.now() - startedAt,
      status: INTEGRATION_EXECUTION_STATUS.FAILED,
      triggerMode
    });

    throw error;
  }
}

export async function runIntegrationHealthCheck(connectorId: string) {
  registerDefaultIntegrations();

  const connector = await prisma.connectorConfig.findFirst({
    where: {
      id: connectorId
    }
  });

  if (!connector) {
    throw new Error('Connector config not found');
  }

  const adapter = getIntegrationAdapter(connector.adapterKey);

  if (!adapter) {
    throw new Error(`Adapter '${connector.adapterKey}' is not registered`);
  }

  const connectorConfig = toConfigRecord(connector.config as Prisma.JsonValue);

  if (!connectorConfig) {
    throw new Error('Connector config must be an object');
  }

  const triggerMode = resolveTriggerMode(connector, INTEGRATION_TRIGGER_MODE.MANUAL);
  const logger = createLogger({
    adapterKey: connector.adapterKey,
    connectorId: connector.id,
    tenantId: connector.tenantId,
    triggerMode
  });
  const validatedConfig = await adapter.validateConfig({
    ...connectorConfig,
    tenantId: connector.tenantId
  });
  const result = await adapter.healthCheck(
    validatedConfig as Record<string, unknown>,
    {
      attempt: 1,
      audit: {
        record: async () => undefined
      },
      logger,
      tenantId: connector.tenantId,
      triggerMode
    }
  );

  return {
    connector,
    result
  };
}

export async function listIntegrationExecutions(input?: {
  connectorId?: string;
  tenantId?: string;
}) {
  return prisma.integrationExecution.findMany({
    where: {
      connectorConfigId: input?.connectorId,
      tenantId: input?.tenantId
    },
    orderBy: {
      startedAt: 'desc'
    }
  });
}
