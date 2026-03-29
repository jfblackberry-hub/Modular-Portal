import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import {
  clearAdminClientCache,
  fetchAdminJsonCached
} from '../lib/admin-client-data';
import { ADMIN_SESSION_STORAGE_KEY } from '../lib/api-auth';

const sharedUrl = 'https://api.test.invalid/api/tenant-admin/settings';

afterEach(() => {
  clearAdminClientCache();
  Reflect.deleteProperty(globalThis, 'fetch');
});

test('same URL for two tenants uses separate cache entries and does not reuse payloads', async () => {
  const bodies = { a: { tenant: 'alpha' }, b: { tenant: 'beta' } };
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    const body = fetchCount === 1 ? bodies.a : bodies.b;
    return {
      ok: true,
      json: async () => body
    };
  }) as typeof fetch;

  const first = await fetchAdminJsonCached<typeof bodies.a>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'tenant-a' },
    ttlMs: 60_000
  });

  const second = await fetchAdminJsonCached<typeof bodies.b>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'tenant-b' },
    ttlMs: 60_000
  });

  assert.equal(fetchCount, 2);
  assert.equal(first.tenant, 'alpha');
  assert.equal(second.tenant, 'beta');

  const cachedA = await fetchAdminJsonCached<typeof bodies.a>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'tenant-a' },
    ttlMs: 60_000
  });

  assert.equal(fetchCount, 2);
  assert.equal(cachedA.tenant, 'alpha');
});

test('tenant-scoped cache does not return another tenant cached response for identical requests', async () => {
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ id: fetchCount === 1 ? 'first-tenant' : 'second-tenant' })
    };
  }) as typeof fetch;

  const forB = await fetchAdminJsonCached<{ id: string }>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'tenant-b' },
    ttlMs: 60_000
  });

  const forA = await fetchAdminJsonCached<{ id: string }>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'tenant-a' },
    ttlMs: 60_000
  });

  assert.equal(forB.id, 'first-tenant');
  assert.equal(forA.id, 'second-tenant');
  assert.equal(fetchCount, 2);
});

test('platform scope is isolated from tenant scope for the same URL', async () => {
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ scope: fetchCount === 1 ? 'platform' : 'tenant' })
    };
  }) as typeof fetch;

  const platformPayload = await fetchAdminJsonCached<{ scope: string }>(sharedUrl, {
    cacheContext: { scope: 'platform' },
    ttlMs: 60_000
  });

  const tenantPayload = await fetchAdminJsonCached<{ scope: string }>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'tenant-x' },
    ttlMs: 60_000
  });

  assert.equal(platformPayload.scope, 'platform');
  assert.equal(tenantPayload.scope, 'tenant');
  assert.equal(fetchCount, 2);
});

test('tenant scope with empty tenantId throws instead of falling back to a shared bucket', async () => {
  await assert.rejects(
    () =>
      fetchAdminJsonCached(sharedUrl, {
        cacheContext: { scope: 'tenant', tenantId: '   ' }
      }),
    /non-empty tenantId/
  );
});

test('x-tenant-id header mismatch with cache tenant context throws', async () => {
  globalThis.fetch = (async () =>
    ({
      ok: true,
      json: async () => ({ ok: true })
    }) as Response) as typeof fetch;

  await assert.rejects(
    () =>
      fetchAdminJsonCached(sharedUrl, {
        cacheContext: { scope: 'tenant', tenantId: 'expected' },
        headers: { 'x-tenant-id': 'other' }
      }),
    /cache isolation/
  );
});

test('sessionTenant scope does not read cache when session tenant is unavailable', async () => {
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ n: fetchCount })
    };
  }) as typeof fetch;

  const first = await fetchAdminJsonCached<{ n: number }>(sharedUrl, {
    cacheContext: { scope: 'sessionTenant' },
    ttlMs: 60_000
  });

  const second = await fetchAdminJsonCached<{ n: number }>(sharedUrl, {
    cacheContext: { scope: 'sessionTenant' },
    ttlMs: 60_000
  });

  assert.equal(first.n, 1);
  assert.equal(second.n, 2);
  assert.equal(fetchCount, 2);
});

test('sessionTenant scope caches per resolved session tenant id', async () => {
  const store = new Map<string, string>();

  const sessionStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    }
  } as Storage;

  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { sessionStorage },
    writable: true
  });

  store.set(
    ADMIN_SESSION_STORAGE_KEY,
    JSON.stringify({ tenantId: 'session-tenant-7' })
  );

  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ hit: fetchCount })
    };
  }) as typeof fetch;

  try {
    const one = await fetchAdminJsonCached<{ hit: number }>(sharedUrl, {
      cacheContext: { scope: 'sessionTenant' },
      ttlMs: 60_000,
      resourceDiscriminator: 'r1'
    });

    const two = await fetchAdminJsonCached<{ hit: number }>(sharedUrl, {
      cacheContext: { scope: 'sessionTenant' },
      ttlMs: 60_000,
      resourceDiscriminator: 'r1'
    });

    assert.equal(one.hit, 1);
    assert.equal(two.hit, 1);
    assert.equal(fetchCount, 1);
  } finally {
    if (previousWindow === undefined) {
      Reflect.deleteProperty(globalThis, 'window');
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
        writable: true
      });
    }
  }
});

test('clearAdminClientCache with tenantId only removes entries for that tenant', async () => {
  globalThis.fetch = (async () =>
    ({
      ok: true,
      json: async () => ({ v: 1 })
    }) as Response) as typeof fetch;

  await fetchAdminJsonCached(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'keep-me' },
    ttlMs: 60_000
  });

  await fetchAdminJsonCached(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'drop-me' },
    ttlMs: 60_000
  });

  clearAdminClientCache({ tenantId: 'drop-me' });

  let fetchCount = 0;
  globalThis.fetch = (async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ v: fetchCount })
    };
  }) as typeof fetch;

  await fetchAdminJsonCached(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'keep-me' },
    ttlMs: 60_000
  });

  await fetchAdminJsonCached(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 'drop-me' },
    ttlMs: 60_000
  });

  assert.equal(fetchCount, 1);
});

test('subjectKey splits cache entries for the same tenant and URL', async () => {
  let fetchCount = 0;

  globalThis.fetch = (async () => {
    fetchCount += 1;
    return {
      ok: true,
      json: async () => ({ k: fetchCount })
    };
  }) as typeof fetch;

  const u1 = await fetchAdminJsonCached<{ k: number }>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 't' },
    subjectKey: 'user-1',
    ttlMs: 60_000
  });

  const u2 = await fetchAdminJsonCached<{ k: number }>(sharedUrl, {
    cacheContext: { scope: 'tenant', tenantId: 't' },
    subjectKey: 'user-2',
    ttlMs: 60_000
  });

  assert.equal(u1.k, 1);
  assert.equal(u2.k, 2);
  assert.equal(fetchCount, 2);
});
