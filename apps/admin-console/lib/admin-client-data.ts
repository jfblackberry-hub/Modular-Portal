import { buildTenantCacheKey } from '@payer-portal/config/cache-keys';

import { resolveTenantIdFromAdminSession } from './api-auth';

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<unknown>>();

export type AdminFetchCacheContext =
  | { scope: 'platform' }
  | { scope: 'tenant'; tenantId: string }
  | { scope: 'sessionTenant' };

export type FetchAdminJsonCachedOptions = {
  cacheContext: AdminFetchCacheContext;
  headers?: HeadersInit;
  ttlMs?: number;
  resourceDiscriminator?: string;
  subjectKey?: string;
};

function tenantCacheKeyPrefix(tenantId: string) {
  const encodedTenant = encodeURIComponent(tenantId.trim() || 'none');
  return `tenant:${encodedTenant}:`;
}

export function clearAdminClientCache(scope?: { tenantId?: string }) {
  const tid = scope?.tenantId?.trim();

  if (!tid) {
    responseCache.clear();
    inflightRequests.clear();
    return;
  }

  const prefix = tenantCacheKeyPrefix(tid);

  for (const key of [...responseCache.keys()]) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }

  for (const key of [...inflightRequests.keys()]) {
    if (key.startsWith(prefix)) {
      inflightRequests.delete(key);
    }
  }
}

function normalizeHeaders(headers?: HeadersInit) {
  if (!headers) {
    return '';
  }

  if (headers instanceof Headers) {
    return JSON.stringify([...headers.entries()].sort(([left], [right]) => left.localeCompare(right)));
  }

  if (Array.isArray(headers)) {
    return JSON.stringify(
      [...headers].sort(([left], [right]) => left.localeCompare(right))
    );
  }

  return JSON.stringify(
    Object.entries(headers).sort(([left], [right]) => left.localeCompare(right))
  );
}

function readHeaderTenantId(headers?: HeadersInit): string | undefined {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    const value = headers.get('x-tenant-id')?.trim();
    return value || undefined;
  }

  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === 'x-tenant-id');
    const value = found?.[1]?.trim();
    return value || undefined;
  }

  const record = headers as Record<string, string | undefined>;
  const raw = record['x-tenant-id'] ?? record['X-Tenant-Id'];
  if (typeof raw !== 'string') {
    return undefined;
  }

  const value = raw.trim();
  return value || undefined;
}

function assertHeaderTenantMatchesCacheContext(
  effectiveTenantId: string,
  headers?: HeadersInit
) {
  const headerTenantId = readHeaderTenantId(headers);

  if (headerTenantId && headerTenantId !== effectiveTenantId) {
    throw new Error(
      'Admin fetch cache isolation: x-tenant-id header does not match cache tenant context.'
    );
  }
}

function resolveEffectiveCacheTenantId(
  cacheContext: AdminFetchCacheContext
): { tenantId: string; useCache: true } | { tenantId: null; useCache: false } {
  if (cacheContext.scope === 'platform') {
    return { tenantId: 'platform', useCache: true };
  }

  if (cacheContext.scope === 'tenant') {
    const tenantId = cacheContext.tenantId.trim();

    if (!tenantId) {
      throw new Error('fetchAdminJsonCached: tenant scope requires a non-empty tenantId.');
    }

    return { tenantId, useCache: true };
  }

  const fromSession = resolveTenantIdFromAdminSession();

  if (!fromSession) {
    return { tenantId: null, useCache: false };
  }

  return { tenantId: fromSession, useCache: true };
}

async function fetchAdminJsonUncached<T>(url: string, headers?: HeadersInit): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return (await response.json()) as T;
}

export async function fetchAdminJsonCached<T>(url: string, options: FetchAdminJsonCachedOptions) {
  const ttlMs = options.ttlMs ?? 15_000;
  const { cacheContext } = options;

  const resolved = resolveEffectiveCacheTenantId(cacheContext);

  if (!resolved.useCache || resolved.tenantId === null) {
    return fetchAdminJsonUncached<T>(url, options.headers);
  }

  const effectiveTenantId = resolved.tenantId;

  if (cacheContext.scope !== 'platform') {
    assertHeaderTenantMatchesCacheContext(effectiveTenantId, options.headers);
  }

  const cacheKey = buildTenantCacheKey({
    tenantId: effectiveTenantId,
    resource: 'admin-api-response',
    parts: [
      url,
      normalizeHeaders(options.headers),
      options.resourceDiscriminator ?? '',
      options.subjectKey ?? ''
    ]
  });

  const now = Date.now();
  const cached = responseCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const inflight = inflightRequests.get(cacheKey);

  if (inflight) {
    return inflight as Promise<T>;
  }

  const request = fetch(url, {
    cache: 'no-store',
    headers: options.headers
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Request failed for ${url}`);
      }

      const payload = (await response.json()) as T;
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        data: payload
      });
      inflightRequests.delete(cacheKey);
      return payload;
    })
    .catch((error) => {
      inflightRequests.delete(cacheKey);
      throw error;
    });

  inflightRequests.set(cacheKey, request);
  return request;
}

export async function mapWithConcurrency<TValue, TResult>(
  values: TValue[],
  concurrency: number,
  mapper: (value: TValue, index: number) => Promise<TResult>
) {
  if (values.length === 0) {
    return [] as TResult[];
  }

  const results = new Array<TResult>(values.length);
  const workerCount = Math.max(1, Math.min(concurrency, values.length));
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await mapper(values[currentIndex], currentIndex);
      }
    })
  );

  return results;
}
