import { randomUUID } from 'node:crypto';

import type { ConnectorConfig } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { publishInBackground } from '../events/eventBus.js';
import type { PlatformEvent } from '../events/eventTypes.js';
import {
  INTEGRATION_TRIGGER_MODE,
  type IntegrationTriggerMode
} from '../integrations/integration.js';
import {
  executeIntegration,
  runIntegrationHealthCheck
} from '../integrations/service.js';

export async function runConnectorSync(
  connectorId: string,
  requestedByUserId?: string | null,
  triggerMode: IntegrationTriggerMode = INTEGRATION_TRIGGER_MODE.MANUAL,
  event?: PlatformEvent
): Promise<ConnectorConfig> {
  const execution = await executeIntegration(connectorId, {
    event,
    requestedByUserId,
    triggerMode
  });

  publishInBackground('integration.completed', {
    id: randomUUID(),
    correlationId: randomUUID(),
    timestamp: execution.connector.lastSyncAt ?? new Date(),
    tenantId: execution.connector.tenantId,
    type: 'integration.completed',
    payload: {
      integrationId: execution.connector.id,
      integrationKey: execution.connector.adapterKey,
      status: 'SUCCEEDED',
      completedAt: execution.connector.lastSyncAt ?? new Date(),
      recordsProcessed: execution.result.recordsProcessed
    }
  });

  return execution.connector;
}

export async function runConnectorHealthCheck(connectorId: string) {
  const result = await runIntegrationHealthCheck(connectorId);

  const updateResult = await prisma.connectorConfig.updateMany({
    where: {
      id: result.connector.id,
      tenantId: result.connector.tenantId
    },
    data: {
      lastHealthCheckAt: new Date(),
      status: result.result.ok ? 'ACTIVE' : 'ERROR'
    }
  });

  if (updateResult.count === 0) {
    throw new Error('Connector config not found');
  }

  const updatedConnector = await prisma.connectorConfig.findFirst({
    where: {
      id: result.connector.id,
      tenantId: result.connector.tenantId
    }
  });

  if (!updatedConnector) {
    throw new Error('Connector config not found');
  }

  return updatedConnector;
}
