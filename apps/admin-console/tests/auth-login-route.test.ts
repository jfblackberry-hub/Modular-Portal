import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { POST } from '../app/api/auth/login/route';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('non-admin login returns only a secure handoff redirect and no raw downstream auth payload', async () => {
  let fetchCount = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    fetchCount += 1;
    const url = String(input);

    if (url.endsWith('/auth/login')) {
      return new Response(
        JSON.stringify({
          token: 'sensitive-access-token',
          user: {
            id: 'member-user',
            email: 'member@example.com',
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
      );
    }

    if (url.endsWith('/auth/portal-handoffs')) {
      return new Response(
        JSON.stringify({
          artifact: 'signed-handoff-artifact'
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      );
    }

    throw new Error(`Unexpected fetch: ${url}`);
  }) as typeof fetch;

  const response = await POST(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'member@example.com',
        password: 'demo'
      })
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    handoffRequired?: boolean;
    artifact?: string;
    handoffUrl?: string;
    token?: string;
    user?: unknown;
  };
  assert.equal(fetchCount, 2);
  assert.equal(payload.handoffRequired, true);
  assert.equal(payload.artifact, 'signed-handoff-artifact');
  assert.match(payload.handoffUrl ?? '', /\/api\/auth\/handoff$/);
  assert.equal('token' in payload, false);
  assert.equal('user' in payload, false);
});
