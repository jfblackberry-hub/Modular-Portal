import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { POST } from '../app/api/auth/logout/route';
import { requestAdminLogout } from '../lib/admin-logout';
import { recordPersonaSessionAuditEvent } from '../lib/admin-platform-audit';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('admin logout route proxies the authoritative server logout endpoint', async () => {
  let fetchUrl = '';
  let fetchAuthorization = '';

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    fetchUrl = String(input);
    fetchAuthorization = String(
      init?.headers && !Array.isArray(init.headers) && !(init.headers instanceof Headers)
        ? init.headers.Authorization
        : ''
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json'
      }
    });
  }) as typeof fetch;

  const response = await POST(
    new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: {
        authorization: 'Bearer admin-token',
        'x-tenant-id': 'platform'
      }
    })
  );

  assert.equal(response.status, 200);
  assert.match(fetchUrl, /\/auth\/logout$/);
  assert.equal(fetchAuthorization, 'Bearer admin-token');
});

test('admin logout helper surfaces authoritative logout failures', async () => {
  const failingFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ message: 'audit pipeline unavailable' }), {
      status: 503,
      headers: {
        'content-type': 'application/json'
      }
    });

  await assert.rejects(
    () => requestAdminLogout(failingFetch),
    /audit pipeline unavailable/i
  );
});

test('persona audit helper surfaces API failure messages instead of swallowing them', async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: 'tenant scope denied' }), {
      status: 403,
      headers: {
        'content-type': 'application/json'
      }
    })) as typeof fetch;

  await assert.rejects(
    () =>
      recordPersonaSessionAuditEvent({
        action: 'persona.session.closed',
        sessionId: 'session-1',
        tenantId: 'tenant-1',
        personaType: 'member',
        userId: 'user-1'
      }),
    /tenant scope denied/i
  );
});
