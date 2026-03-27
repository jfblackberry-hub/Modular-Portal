import type { IntegrationAdapter } from '../integration.js';

type NorthstarDemoFeedConfig = {
  endpoint: string;
  mode?: string;
  tenantId?: string;
};

function normalizeConfig(config: Record<string, unknown>): NorthstarDemoFeedConfig {
  const endpoint = typeof config.endpoint === 'string' ? config.endpoint.trim() : '';
  const mode = typeof config.mode === 'string' ? config.mode.trim() : undefined;
  const tenantId = typeof config.tenantId === 'string' ? config.tenantId.trim() : undefined;

  if (!endpoint) {
    throw new Error('endpoint is required');
  }

  return {
    endpoint,
    mode,
    tenantId
  };
}

function buildNorthstarDemoAdapter(
  key: 'northstar-eligibility-feed' | 'northstar-claims-feed',
  description: string
): IntegrationAdapter<Record<string, unknown>, NorthstarDemoFeedConfig> {
  return {
    key,
    description,
    capabilities: {
      authentication: false,
      eventTrigger: false,
      healthCheck: true,
      rest: false,
      retries: true,
      scheduled: true,
      sync: true
    },
    validateConfig(config) {
      const normalized = normalizeConfig(config);

      if (normalized.mode && normalized.mode !== 'synthetic-demo') {
        throw new Error('mode must be synthetic-demo when provided');
      }

      return normalized;
    },
    async healthCheck(config, context) {
      context.logger.info('NorthStar demo integration health check succeeded', {
        adapterKey: key,
        endpoint: config.endpoint
      });

      return {
        ok: true,
        message: 'Synthetic demo feed is available'
      };
    },
    async sync(config, context) {
      context.logger.info('NorthStar demo integration sync executed', {
        adapterKey: key,
        endpoint: config.endpoint,
        tenantId: config.tenantId ?? context.tenantId
      });

      return {
        ok: true,
        message: 'Synthetic demo feed returned no-op records',
        metadata: {
          endpoint: config.endpoint,
          mode: config.mode ?? 'synthetic-demo'
        },
        recordsProcessed: 0
      };
    }
  };
}

export const northstarEligibilityFeedAdapter = buildNorthstarDemoAdapter(
  'northstar-eligibility-feed',
  'Synthetic eligibility integration for the local NorthStar provider demo.'
);

export const northstarClaimsFeedAdapter = buildNorthstarDemoAdapter(
  'northstar-claims-feed',
  'Synthetic claims integration for the local NorthStar provider demo.'
);
