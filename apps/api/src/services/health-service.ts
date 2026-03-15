import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

import { prisma } from '@payer-portal/database';
import {
  get,
  getStorageDirectory,
  registerDefaultAdapters
} from '@payer-portal/server';
import type { Prisma } from '@payer-portal/database';

type CheckStatus = 'fail' | 'not_configured' | 'pass';

type HealthCheckResult = {
  details?: Record<string, unknown>;
  error?: string;
  latencyMs?: number;
  status: CheckStatus;
};

type HealthResponse = {
  checks: {
    database: HealthCheckResult;
    integrations: HealthCheckResult;
    redis: HealthCheckResult;
    storage: HealthCheckResult;
  };
  service: 'api';
  status: 'degraded' | 'ok';
  timestamp: string;
};

function toConfigRecord(value: Prisma.JsonValue): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function summarizeStatus(checks: HealthResponse['checks']) {
  const values = Object.values(checks);

  return values.some((check) => check.status === 'fail') ? 'degraded' : 'ok';
}

function isReady(checks: HealthResponse['checks']) {
  return !Object.values(checks).some((check) => check.status === 'fail');
}

async function checkDatabaseConnectivity(): Promise<HealthCheckResult> {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      latencyMs: Date.now() - startedAt,
      status: 'pass'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Database check failed',
      latencyMs: Date.now() - startedAt,
      status: 'fail'
    };
  }
}

async function checkRedisConnectivity(): Promise<HealthCheckResult> {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    return {
      details: {
        configured: false
      },
      status: 'not_configured'
    };
  }

  const startedAt = Date.now();

  try {
    const url = new URL(redisUrl);
    const host = url.hostname || '127.0.0.1';
    const port = Number(url.port || 6379);

    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Redis connection timed out'));
      }, 1_000);

      socket.once('connect', () => {
        clearTimeout(timeout);
        socket.end();
        resolve();
      });
      socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    return {
      details: {
        host,
        port
      },
      latencyMs: Date.now() - startedAt,
      status: 'pass'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Redis check failed',
      latencyMs: Date.now() - startedAt,
      status: 'fail'
    };
  }
}

async function checkStorageServices(): Promise<HealthCheckResult> {
  const startedAt = Date.now();
  const storageDirectory = getStorageDirectory();
  const probeFile = path.join(storageDirectory, `.health-${randomUUID()}.tmp`);

  try {
    await fs.mkdir(storageDirectory, { recursive: true });
    await fs.writeFile(probeFile, 'ok', 'utf8');
    await fs.readFile(probeFile, 'utf8');
    await fs.rm(probeFile, { force: true });

    return {
      details: {
        storageDirectory
      },
      latencyMs: Date.now() - startedAt,
      status: 'pass'
    };
  } catch (error) {
    await fs.rm(probeFile, { force: true }).catch(() => undefined);

    return {
      details: {
        storageDirectory
      },
      error: error instanceof Error ? error.message : 'Storage check failed',
      latencyMs: Date.now() - startedAt,
      status: 'fail'
    };
  }
}

async function checkIntegrationServices(): Promise<HealthCheckResult> {
  const startedAt = Date.now();

  try {
    const adapters = registerDefaultAdapters();
    const activeConnectors = await prisma.connectorConfig.findMany({
      where: {
        status: 'ACTIVE'
      }
    });

    for (const connector of activeConnectors) {
      const adapter = get(connector.adapterKey);

      if (!adapter) {
        throw new Error(`Adapter '${connector.adapterKey}' is not registered`);
      }

      const config = toConfigRecord(connector.config as Prisma.JsonValue);

      if (!config) {
        throw new Error(`Connector '${connector.id}' config must be an object`);
      }

      await adapter.validateConfig({
        ...config,
        tenantId: connector.tenantId
      });
    }

    return {
      details: {
        activeConnectorCount: activeConnectors.length,
        adapterCount: adapters.length
      },
      latencyMs: Date.now() - startedAt,
      status: 'pass'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Integration check failed',
      latencyMs: Date.now() - startedAt,
      status: 'fail'
    };
  }
}

export function getLiveStatus() {
  return {
    service: 'api' as const,
    status: 'ok' as const,
    timestamp: new Date().toISOString()
  };
}

export async function getReadinessStatus() {
  const checks = {
    database: await checkDatabaseConnectivity(),
    redis: await checkRedisConnectivity(),
    integrations: await checkIntegrationServices(),
    storage: await checkStorageServices()
  };

  const response: HealthResponse = {
    checks,
    service: 'api',
    status: summarizeStatus(checks),
    timestamp: new Date().toISOString()
  };

  return {
    ready: isReady(checks),
    response
  };
}

export async function getHealthStatus() {
  return getReadinessStatus();
}
