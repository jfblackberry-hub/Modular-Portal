import { publish } from '../../events/eventBus.js';
import type { IntegrationAdapter, IntegrationAuthentication } from '../integration.js';

type RestAdapterConfig = {
  authToken?: string;
  authentication?: IntegrationAuthentication;
  baseUrl: string;
  endpointPath: string;
  method?: string;
  tenantId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeConfig(config: Record<string, unknown>): RestAdapterConfig {
  const baseUrl = typeof config.baseUrl === 'string' ? config.baseUrl.trim() : '';
  const endpointPath =
    typeof config.endpointPath === 'string' ? config.endpointPath.trim() : '';
  const method =
    typeof config.method === 'string' ? config.method.trim().toUpperCase() : 'GET';
  const authToken =
    typeof config.authToken === 'string' ? config.authToken.trim() : undefined;
  const tenantId = typeof config.tenantId === 'string' ? config.tenantId.trim() : undefined;

  if (!baseUrl) {
    throw new Error('baseUrl is required');
  }

  if (!endpointPath) {
    throw new Error('endpointPath is required');
  }

  const authentication = isRecord(config.authentication)
    ? (config.authentication as IntegrationAuthentication)
    : authToken
      ? { type: 'bearer' as const, token: authToken }
      : { type: 'none' as const };

  return {
    authentication,
    baseUrl,
    endpointPath,
    method,
    tenantId
  };
}

function buildUrl(config: RestAdapterConfig) {
  return new URL(config.endpointPath, config.baseUrl).toString();
}

function buildHeaders(authentication: IntegrationAuthentication): Record<string, string> {
  if (authentication.type === 'apiKey') {
    return {
      [authentication.headerName ?? 'x-api-key']: authentication.value
    };
  }

  if (authentication.type === 'basic') {
    return {
      Authorization: `Basic ${Buffer.from(
        `${authentication.username}:${authentication.password}`
      ).toString('base64')}`
    };
  }

  if (authentication.type === 'bearer') {
    return {
      Authorization: `Bearer ${authentication.token}`
    };
  }

  return {};
}

async function fetchJson(config: RestAdapterConfig) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...buildHeaders(config.authentication ?? { type: 'none' })
  };

  const response = await fetch(buildUrl(config), {
    method: config.method,
    headers
  });

  if (!response.ok) {
    throw new Error(`REST adapter request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
}

function toRecords(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload) && Array.isArray(payload.records)) {
    return payload.records.filter(isRecord);
  }

  if (isRecord(payload)) {
    return [payload];
  }

  return [];
}

export const restAdapter: IntegrationAdapter<Record<string, unknown>, RestAdapterConfig> = {
  key: 'rest-api',
  description: 'Generic REST integration adapter for claims, member, CRM, and warehouse feeds.',
  capabilities: {
    authentication: true,
    eventTrigger: true,
    healthCheck: true,
    rest: true,
    retries: true,
    scheduled: true,
    sync: true
  },
  validateConfig(config) {
    return normalizeConfig(config);
  },
  async healthCheck(config, context) {
    try {
      await fetchJson(config);
      context.logger.info('REST integration health check succeeded', {
        adapterKey: 'rest-api',
        endpointPath: config.endpointPath
      });

      return {
        ok: true,
        message: 'REST API is reachable'
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'REST API unavailable'
      };
    }
  },
  async sync(config, context) {
    const payload = await fetchJson(config);
    const records = toRecords(payload);
    let eventsPublished = 0;

    for (const [index, record] of records.entries()) {
      eventsPublished += 1;

      console.log('[connector] parsed record', {
        adapterKey: 'rest-api',
        endpointPath: config.endpointPath,
        record
      });

      await publish('connector.record.imported', {
        id: `rest:${index + 1}`,
        correlationId: `rest:${index + 1}`,
        timestamp: new Date(),
        tenantId: config.tenantId ?? null,
        type: 'connector.record.imported',
        payload: {
          adapterKey: 'rest-api',
          fileName: config.endpointPath,
          record
        }
      });
    }

    context.logger.info('REST integration sync completed', {
      adapterKey: 'rest-api',
      endpointPath: config.endpointPath,
      recordsProcessed: records.length
    });

    return {
      ok: true,
      message: `Fetched ${records.length} records`,
      eventsPublished,
      metadata: {
        endpointPath: config.endpointPath
      },
      recordsProcessed: records.length
    };
  }
};
