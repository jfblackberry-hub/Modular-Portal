import type { IntegrationAdapter, IntegrationAuthentication } from '../integration.js';

type WebhookAdapterConfig = {
  authentication?: IntegrationAuthentication;
  endpointUrl: string;
  eventTypes: string[];
  headers?: Record<string, string>;
  method?: string;
  payload?: Record<string, unknown>;
  retryPolicy?: {
    maxAttempts?: number;
  };
  tenantId?: string;
  timeoutMs: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeConfig(config: Record<string, unknown>): WebhookAdapterConfig {
  const endpointUrl =
    typeof config.endpoint_url === 'string'
      ? config.endpoint_url.trim()
      : typeof config.url === 'string'
        ? config.url.trim()
        : '';
  const method =
    typeof config.method === 'string' ? config.method.trim().toUpperCase() : 'POST';
  const eventTypes = Array.isArray(config.event_types)
    ? config.event_types.filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      )
    : [];
  const headers = isRecord(config.headers)
    ? Object.fromEntries(
        Object.entries(config.headers).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
      )
    : {};
  const retryPolicy =
    isRecord(config.retry_policy) &&
    typeof config.retry_policy.max_attempts === 'number'
      ? {
          maxAttempts: Math.max(1, Math.floor(config.retry_policy.max_attempts))
        }
      : undefined;
  const timeoutMs =
    typeof config.timeout === 'number' && config.timeout > 0
      ? Math.floor(config.timeout)
      : 10_000;

  if (!endpointUrl) {
    throw new Error('endpoint_url is required');
  }

  if (eventTypes.length === 0) {
    throw new Error('event_types must include at least one event');
  }

  return {
    authentication: isRecord(config.authentication)
      ? (config.authentication as IntegrationAuthentication)
      : { type: 'none' },
    endpointUrl,
    eventTypes,
    headers,
    method,
    payload: isRecord(config.payload) ? config.payload : {},
    retryPolicy,
    tenantId: typeof config.tenantId === 'string' ? config.tenantId.trim() : undefined,
    timeoutMs
  };
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

async function dispatchWebhook(config: WebhookAdapterConfig) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
    ...buildHeaders(config.authentication ?? { type: 'none' })
  };

  const response = await fetch(config.endpointUrl, {
    method: config.method,
    headers,
    body: JSON.stringify(config.payload ?? {}),
    signal: AbortSignal.timeout(config.timeoutMs)
  });

  if (!response.ok) {
    throw new Error(`Webhook adapter request failed with ${response.status}`);
  }

  return response;
}

export const webhookAdapter: IntegrationAdapter<
  Record<string, unknown>,
  WebhookAdapterConfig
> = {
  key: 'webhook',
  description: 'Event-triggered webhook adapter for external platform subscribers.',
  capabilities: {
    authentication: true,
    eventTrigger: true,
    healthCheck: true,
    retries: true,
    scheduled: false,
    sync: true,
    webhook: true
  },
  validateConfig(config) {
    return normalizeConfig(config);
  },
  async healthCheck(config, context) {
    try {
      const response = await dispatchWebhook({
        ...config,
        payload: {
          event: 'health.check',
          timestamp: new Date().toISOString(),
          tenant_id: config.tenantId ?? null,
          data: {}
        }
      });
      context.logger.info('Webhook integration health check succeeded', {
        adapterKey: 'webhook',
        url: config.endpointUrl
      });

      return {
        ok: true,
        message: `Webhook responded with ${response.status}`
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Webhook unavailable'
      };
    }
  },
  async sync(config, context) {
    if (!context.event) {
      throw new Error('Webhook integrations require an event payload');
    }

    const payload = {
      correlation_id: context.event.correlationId,
      data: context.event.payload,
      event: context.event.type,
      event_id: context.event.id,
      tenant_id: context.event.tenantId,
      timestamp: context.event.timestamp.toISOString()
    };

    const response = await dispatchWebhook({
      ...config,
      payload
    });
    context.logger.info('Webhook integration dispatched payload', {
      adapterKey: 'webhook',
      eventType: context.event.type,
      status: response.status,
      url: config.endpointUrl
    });

    return {
      ok: true,
      message: `Webhook dispatched with ${response.status}`,
      metadata: {
        eventType: context.event.type,
        method: config.method,
        timeoutMs: config.timeoutMs,
        url: config.endpointUrl
      },
      recordsProcessed: 1
    };
  }
};
