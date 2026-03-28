import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  createAdminSessionHandoff,
  requiresAdminSessionHandoff
} from '../lib/admin-session-handoff';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('requiresAdminSessionHandoff returns true for tenant admin sessions', () => {
  assert.equal(
    requiresAdminSessionHandoff({
      landingContext: 'tenant_admin',
      roles: ['tenant_admin'],
      session: {
        type: 'tenant_admin'
      }
    } as never),
    true
  );
});

test('createAdminSessionHandoff builds an admin login handoff URL', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        artifact: 'signed-admin-artifact',
        redirectPath: '/admin/tenants/tenant-1/organization'
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    )) as typeof fetch;

  const result = await createAdminSessionHandoff({
    accessToken: 'admin-token',
    user: {
      landingContext: 'tenant_admin',
      roles: ['tenant_admin'],
      session: {
        type: 'tenant_admin',
        tenantId: 'tenant-1'
      }
    } as never
  });

  assert.equal(result.sessionHandoff, true);
  assert.match(result.handoffUrl, /\/login\?/);
  assert.match(result.handoffUrl, /artifact=signed-admin-artifact/);
  assert.match(result.handoffUrl, /redirectPath=%2Fadmin%2Ftenants%2Ftenant-1%2Forganization/);
});
