import 'server-only';

import { buildTenantCacheKey } from '@payer-portal/config/cache-keys';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const DEFAULT_TTL_MS = 60_000;
const sessionResponseCache = new Map<string, CacheEntry<unknown>>();
const sessionInflightCache = new Map<string, Promise<unknown>>();

export function createDashboardSessionCacheKey(parts: Array<string | null | undefined>) {
  const [resource = 'dashboard', tenantId = 'unknown-tenant', ...rest] = parts;

  return buildTenantCacheKey({
    tenantId: tenantId?.trim() || 'unknown-tenant',
    resource: resource?.trim() || 'dashboard',
    parts: rest
  });
}

export async function getCachedDashboardSessionValue<T>(
  cacheKey: string,
  loader: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
) {
  const cachedValue = sessionResponseCache.get(cacheKey);
  if (cachedValue && cachedValue.expiresAt > Date.now()) {
    return cachedValue.value as T;
  }

  const inflightValue = sessionInflightCache.get(cacheKey);
  if (inflightValue) {
    return (await inflightValue) as T;
  }

  const nextRequest = loader()
    .then((value) => {
      sessionResponseCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        value
      });
      return value;
    })
    .finally(() => {
      sessionInflightCache.delete(cacheKey);
    });

  sessionInflightCache.set(cacheKey, nextRequest as Promise<unknown>);
  return await nextRequest;
}
