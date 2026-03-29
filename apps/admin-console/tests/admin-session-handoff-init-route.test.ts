import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { POST } from '../app/api/auth/session/handoff/init/route';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('handoff init creates an admin handoff artifact for an authenticated admin', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        id: 'admin-user',
        email: 'tenant@example.com',
        tenantId: 'tenant-1',
        roles: ['tenant_admin'],
        permissions: ['tenant.view']
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    )) as typeof fetch;

  const response = await POST(
    new Request('http://localhost/api/auth/session/handoff/init', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redirectPath: '/admin/tenant/health'
      })
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    artifact?: string;
    redirectPath?: string;
  };

  assert.equal(payload.redirectPath, '/admin/tenant/health');
  assert.equal(typeof payload.artifact, 'string');
  assert.ok(payload.artifact);
});

test('handoff init accepts tenant admin session metadata when role arrays are empty', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        id: 'tenant-user',
        email: 'tenant@example.com',
        tenantId: 'tenant-1',
        roles: [],
        permissions: [],
        landingContext: 'tenant_admin',
        session: {
          type: 'tenant_admin',
          tenantId: 'tenant-1',
          permissions: ['tenant.view']
        }
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    )) as typeof fetch;

  const response = await POST(
    new Request('http://localhost/api/auth/session/handoff/init', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json'
      }
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    artifact?: string;
    redirectPath?: string;
  };

  assert.equal(payload.redirectPath, '/admin/tenants/tenant-1/organization');
  assert.equal(typeof payload.artifact, 'string');
  assert.ok(payload.artifact);
});

test('handoff init ignores unsafe redirectPath and uses session default', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        id: 'tenant-user',
        email: 'tenant@example.com',
        tenantId: 'tenant-1',
        roles: ['tenant_admin'],
        permissions: ['tenant.view']
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    )) as typeof fetch;

  const response = await POST(
    new Request('http://localhost/api/auth/session/handoff/init', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redirectPath: '//evil.com/steal'
      })
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { redirectPath?: string };
  assert.equal(payload.redirectPath, '/admin/tenants/tenant-1/organization');
});
