import { restAdapter } from './adapters/rest.adapter.js';
import {
  northstarClaimsFeedAdapter,
  northstarEligibilityFeedAdapter
} from './adapters/northstarDemoFeeds.adapter.js';
import { localFileAdapter } from './adapters/sftp.adapter.js';
import { webhookAdapter } from './adapters/webhook.adapter.js';
import type {
  IntegrationAdapterModule,
  IntegrationCapabilities,
  RegisteredIntegrationAdapter
} from './integration.js';

const adapters = new Map<string, RegisteredIntegrationAdapter>();
let defaultsRegistered = false;

function normalizeKey(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('Adapter key is required');
  }

  return normalized;
}

function getCapabilities(
  adapter: RegisteredIntegrationAdapter
): IntegrationCapabilities {
  return {
    authentication: adapter.capabilities?.authentication ?? true,
    eventTrigger: adapter.capabilities?.eventTrigger ?? false,
    fileBased: adapter.capabilities?.fileBased ?? false,
    healthCheck: adapter.capabilities?.healthCheck ?? true,
    rest: adapter.capabilities?.rest ?? false,
    retries: adapter.capabilities?.retries ?? true,
    scheduled: adapter.capabilities?.scheduled ?? true,
    sync: adapter.capabilities?.sync ?? true,
    webhook: adapter.capabilities?.webhook ?? false
  };
}

function normalizeAdapter(
  adapter: RegisteredIntegrationAdapter
): RegisteredIntegrationAdapter {
  return {
    ...adapter,
    key: normalizeKey(adapter.key),
    capabilities: getCapabilities(adapter)
  };
}

function resolveAdapterFromModule(
  module: IntegrationAdapterModule
): RegisteredIntegrationAdapter {
  const adapter = module.default ?? module.adapter;

  if (!adapter) {
    throw new Error('Adapter module must export an adapter');
  }

  return adapter;
}

export function registerIntegrationAdapter(
  adapter: RegisteredIntegrationAdapter
) {
  const normalizedAdapter = normalizeAdapter(adapter);

  if (adapters.has(normalizedAdapter.key)) {
    throw new Error(`Adapter '${normalizedAdapter.key}' is already registered`);
  }

  adapters.set(normalizedAdapter.key, normalizedAdapter);
  return normalizedAdapter;
}

export function getIntegrationAdapter(key: string) {
  return adapters.get(normalizeKey(key)) ?? null;
}

export function listIntegrationAdapters() {
  return Array.from(adapters.values()).sort((left, right) =>
    left.key.localeCompare(right.key)
  );
}

export function clearIntegrationAdapters() {
  adapters.clear();
  defaultsRegistered = false;
}

export async function discoverIntegrationAdapters(
  loaders: Array<() => Promise<IntegrationAdapterModule | RegisteredIntegrationAdapter>>
) {
  const discoveredAdapters: RegisteredIntegrationAdapter[] = [];

  for (const load of loaders) {
    const loaded = await load();
    const adapter =
      'key' in loaded
        ? loaded
        : resolveAdapterFromModule(loaded as IntegrationAdapterModule);

    discoveredAdapters.push(registerIntegrationAdapter(adapter));
  }

  return discoveredAdapters;
}

export function registerDefaultIntegrations() {
  if (defaultsRegistered) {
    return listIntegrationAdapters();
  }

  defaultsRegistered = true;

  if (!getIntegrationAdapter(restAdapter.key)) {
    registerIntegrationAdapter(restAdapter);
  }

  if (!getIntegrationAdapter(localFileAdapter.key)) {
    registerIntegrationAdapter(localFileAdapter);
  }

  if (!getIntegrationAdapter(webhookAdapter.key)) {
    registerIntegrationAdapter(webhookAdapter);
  }

  if (!getIntegrationAdapter(northstarEligibilityFeedAdapter.key)) {
    registerIntegrationAdapter(northstarEligibilityFeedAdapter);
  }

  if (!getIntegrationAdapter(northstarClaimsFeedAdapter.key)) {
    registerIntegrationAdapter(northstarClaimsFeedAdapter);
  }

  return listIntegrationAdapters();
}
