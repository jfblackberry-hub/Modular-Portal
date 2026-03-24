import net from 'node:net';

import { readProcessEnv } from '@payer-portal/config';
import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import {
  buildRuntimeHealthResponse,
  buildRuntimeLivenessResponse,
  get,
  getStorageService,
  registerDefaultAdapters
} from '@payer-portal/server';

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

type RuntimeReadinessResponse = ReturnType<typeof buildRuntimeHealthResponse>;

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

function getApiConfigStatus(): RuntimeReadinessResponse['checks'][string] {
  return readProcessEnv('DATABASE_URL') &&
    readProcessEnv('API_PUBLIC_ORIGIN') &&
    readProcessEnv('SESSION_SECRET')
    ? 'ok'
    : 'down';
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
  const redisUrl = readProcessEnv('REDIS_URL');

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
    const host = url.hostname.trim();
    const port = Number(url.port || 6379);

    if (!host) {
      throw new Error('REDIS_URL must include a hostname');
    }

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
  const storage = getStorageService();

  try {
    const result = await storage.healthCheck();

    return {
      details: {
        root: storage.getRootDescriptor(),
        ...result.details
      },
      latencyMs: Date.now() - startedAt,
      status: result.status
    };
  } catch (error) {
    return {
      details: {
        root: storage.getRootDescriptor(),
        provider: storage.getProviderName()
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
    const missingAdapters: string[] = [];
    const invalidConnectors: string[] = [];

    for (const connector of activeConnectors) {
      const adapter = get(connector.adapterKey);

      if (!adapter) {
        missingAdapters.push(connector.adapterKey);
        continue;
      }

      const config = toConfigRecord(connector.config as Prisma.JsonValue);

      if (!config) {
        invalidConnectors.push(connector.id);
        continue;
      }

      try {
        await adapter.validateConfig({
          ...config,
          tenantId: connector.tenantId
        });
      } catch {
        invalidConnectors.push(connector.id);
      }
    }

    if (missingAdapters.length > 0) {
      return {
        details: {
          activeConnectorCount: activeConnectors.length,
          adapterCount: adapters.length,
          missingAdapters: Array.from(new Set(missingAdapters))
        },
        error: 'One or more connector adapters are not registered',
        latencyMs: Date.now() - startedAt,
        status: 'fail'
      };
    }

    if (invalidConnectors.length > 0) {
      return {
        details: {
          activeConnectorCount: activeConnectors.length,
          adapterCount: adapters.length,
          invalidConnectorCount: invalidConnectors.length,
          invalidConnectorIds: invalidConnectors.slice(0, 10)
        },
        latencyMs: Date.now() - startedAt,
        status: 'not_configured'
      };
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
  return buildRuntimeLivenessResponse();
}

export async function getReadinessStatus() {
  const database = await checkDatabaseConnectivity();
  const response = buildRuntimeHealthResponse({
    config: getApiConfigStatus(),
    db: database.status === 'pass' ? 'ok' : 'down'
  });

  return {
    ready: response.status === 'ok',
    response
  };
}

export async function getHealthStatus() {
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
