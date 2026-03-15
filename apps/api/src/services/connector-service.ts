import { randomUUID } from 'node:crypto';

import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import {
  enqueueJob,
  get,
  logAuditEvent,
  publishInBackground,
  registerDefaultAdapters,
  runIntegrationHealthCheck
} from '@payer-portal/server';

type ConnectorInput = {
  adapterKey: string;
  name: string;
  status: string;
  config: Prisma.InputJsonValue;
};

type AuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeStatus(value: string) {
  const normalized = value.trim().toUpperCase();

  if (!['ACTIVE', 'DISABLED', 'ERROR'].includes(normalized)) {
    throw new Error('status must be ACTIVE, DISABLED, or ERROR');
  }

  return normalized;
}

function toConfigRecord(
  value: Prisma.JsonValue | Prisma.InputJsonValue
): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function ensureAdapter(adapterKey: string) {
  registerDefaultAdapters();
  const adapter = get(adapterKey);

  if (!adapter) {
    throw new Error(`Adapter '${adapterKey}' is not registered`);
  }

  return adapter;
}

function mapConnector(connector: {
  id: string;
  tenantId: string;
  adapterKey: string;
  name: string;
  status: string;
  config: Prisma.JsonValue;
  lastSyncAt: Date | null;
  lastHealthCheckAt: Date | null;
  createdAt: Date;
}) {
  const adapter = get(connector.adapterKey);

  return {
    id: connector.id,
    tenantId: connector.tenantId,
    adapterKey: connector.adapterKey,
    name: connector.name,
    status: connector.status,
    config: connector.config,
    lastSyncAt: connector.lastSyncAt,
    lastHealthCheckAt: connector.lastHealthCheckAt,
    createdAt: connector.createdAt,
    capabilities: adapter?.capabilities ?? null
  };
}

export async function listConnectorsForTenant(tenantId: string) {
  registerDefaultAdapters();

  const connectors = await prisma.connectorConfig.findMany({
    where: {
      tenantId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return connectors.map((connector) => mapConnector(connector));
}

export async function createConnectorForTenant(
  tenantId: string,
  input: ConnectorInput,
  context: AuditContext
) {
  const adapterKey = normalizeRequired(input.adapterKey, 'adapterKey');
  const adapter = ensureAdapter(adapterKey);
  const name = normalizeRequired(input.name, 'name');
  const status = normalizeStatus(input.status);

  const createConfig = toConfigRecord(input.config);

  if (!createConfig) {
    throw new Error('config must be an object');
  }

  await adapter.validateConfig({
    ...createConfig,
    tenantId
  });

  const connector = await prisma.connectorConfig.create({
    data: {
      tenantId,
      adapterKey,
      name,
      status,
      config: input.config
    }
  });

  await logAuditEvent({
    tenantId,
    actorUserId: context.actorUserId,
    action: 'connector.created',
    entityType: 'Connector',
    entityId: connector.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      adapterKey: connector.adapterKey
    }
  });

  return mapConnector(connector);
}

export async function updateConnectorForTenant(
  tenantId: string,
  connectorId: string,
  input: Partial<ConnectorInput>,
  context: AuditContext
) {
  const existing = await prisma.connectorConfig.findFirst({
    where: {
      id: connectorId,
      tenantId
    }
  });

  if (!existing) {
    throw new Error('Connector not found');
  }

  const adapterKey =
    input.adapterKey !== undefined
      ? normalizeRequired(input.adapterKey, 'adapterKey')
      : existing.adapterKey;
  const adapter = ensureAdapter(adapterKey);
  const name = input.name !== undefined ? normalizeRequired(input.name, 'name') : existing.name;
  const status =
    input.status !== undefined ? normalizeStatus(input.status) : existing.status;
  const config = input.config !== undefined ? input.config : existing.config;

  const updateConfig = toConfigRecord(config);

  if (!updateConfig) {
    throw new Error('config must be an object');
  }

  await adapter.validateConfig({
    ...updateConfig,
    tenantId
  });

  const connector = await prisma.connectorConfig.update({
    where: {
      id: existing.id
    },
    data: {
      adapterKey,
      name,
      status,
      config: config as Prisma.InputJsonValue
    }
  });

  await logAuditEvent({
    tenantId,
    actorUserId: context.actorUserId,
    action: 'connector.updated',
    entityType: 'Connector',
    entityId: connector.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      adapterKey: connector.adapterKey
    }
  });

  return mapConnector(connector);
}

export async function enqueueConnectorSyncForTenant(
  tenantId: string,
  connectorId: string,
  context: AuditContext
) {
  const connector = await prisma.connectorConfig.findFirst({
    where: {
      id: connectorId,
      tenantId
    }
  });

  if (!connector) {
    throw new Error('Connector not found');
  }

  const job = await enqueueJob({
    type: 'connector.sync',
    tenantId,
    payload: {
      connectorId: connector.id,
      connectorType: connector.adapterKey,
      requestedByUserId: context.actorUserId
    }
  });

  await logAuditEvent({
    tenantId,
    actorUserId: context.actorUserId,
    action: 'connector.sync.requested',
    entityType: 'Connector',
    entityId: connector.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      adapterKey: connector.adapterKey,
      jobId: job.id
    }
  });

  publishInBackground('integration.requested', {
    id: randomUUID(),
    correlationId: randomUUID(),
    timestamp: new Date(),
    tenantId,
    type: 'integration.requested',
    payload: {
      integrationId: connector.id,
      integrationKey: connector.adapterKey,
      requestedByUserId: context.actorUserId,
      jobId: job.id
    }
  });

  return job;
}

export async function runConnectorHealthCheckForTenant(
  tenantId: string,
  connectorId: string,
  context: AuditContext
) {
  const connector = await prisma.connectorConfig.findFirst({
    where: {
      id: connectorId,
      tenantId
    }
  });

  if (!connector) {
    throw new Error('Connector not found');
  }

  const adapter = ensureAdapter(connector.adapterKey);

  const healthConfig = toConfigRecord(connector.config as Prisma.JsonValue);

  if (!healthConfig) {
    throw new Error('config must be an object');
  }

  await adapter.validateConfig({
    ...healthConfig,
    tenantId
  });
  const { result } = await runIntegrationHealthCheck(connector.id);

  const updatedConnector = await prisma.connectorConfig.update({
    where: {
      id: connector.id
    },
    data: {
      lastHealthCheckAt: new Date(),
      status: result.ok ? 'ACTIVE' : 'ERROR'
    }
  });

  await logAuditEvent({
    tenantId,
    actorUserId: context.actorUserId,
    action: 'connector.health.checked',
    entityType: 'Connector',
    entityId: connector.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      adapterKey: connector.adapterKey,
      ok: result.ok,
      message: result.message ?? null
    }
  });

  return {
    connector: mapConnector(updatedConnector),
    result
  };
}
