import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { OPTIONS, POST } from '../app/api/auth/handoff/route';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('handoff consume route sets httpOnly portal session cookie and returns redirect path server-side', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        accessToken: 'portal-access-token',
        redirectPath: '/dashboard',
        user: {
          id: 'member-user',
          email: 'member@example.com',
          firstName: 'Member',
          lastName: 'User',
          landingContext: 'member',
          session: {
            type: 'end_user',
            personaType: 'end_user',
            tenantId: 'tenant-1',
            roles: ['member'],
            permissions: ['member.view']
          },
          tenant: {
            id: 'tenant-1',
            name: 'Tenant One'
          },
          roles: ['member'],
          permissions: ['member.view']
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
    new Request('http://localhost/api/auth/handoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3003'
      },
      body: JSON.stringify({
        artifact: 'signed-artifact'
      })
    })
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    redirectPath: '/dashboard'
  });
  const setCookie = response.headers.get('set-cookie') ?? '';
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /portal-session/i);
});

test('handoff consume route rejects disallowed origins', async () => {
  const response = await OPTIONS(
    new Request('http://localhost/api/auth/handoff', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://malicious.example.com'
      }
    })
  );

  assert.equal(response.status, 403);
});

test('handoff consume route returns auth failure when consume is rejected', async () => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ message: 'rejected' }), {
      status: 401,
      headers: {
        'content-type': 'application/json'
      }
    })) as typeof fetch;

  const response = await POST(
    new Request('http://localhost/api/auth/handoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3003'
      },
      body: JSON.stringify({
        artifact: 'signed-artifact'
      })
    })
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    message: 'Portal handoff rejected.'
  });
});
