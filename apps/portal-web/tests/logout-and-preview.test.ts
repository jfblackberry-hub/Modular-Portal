import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { GET as getPreviewStart } from '../app/api/admin-preview/start/[artifact]/route';
import { GET as getLegacyPreviewStart } from '../app/api/admin-preview/start/route';
import { requestPortalLogout } from '../lib/portal-logout';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('portal logout helper surfaces authoritative logout failures', async () => {
  const failingFetch: typeof fetch = async () =>
    new Response(JSON.stringify({ message: 'logout audit failed' }), {
      status: 502,
      headers: {
        'content-type': 'application/json'
      }
    });

  await assert.rejects(
    () => requestPortalLogout(failingFetch),
    /logout audit failed/i
  );
});

test('legacy preview launch query token flow is disabled', async () => {
  const response = await getLegacyPreviewStart(
    new Request('http://localhost/api/admin-preview/start?token=sensitive-token')
  );

  assert.equal(response.status, 307);
  assert.match(
    response.headers.get('location') ?? '',
    /reason=legacy-launch-url-disabled/
  );
});

test('preview launch consumes an opaque artifact path without a query token', async () => {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    assert.match(url, /\/preview-sessions\/launch\/opaque-artifact$/);

    return new Response(
      JSON.stringify({
        session: {
          sessionId: 'preview-session-1',
          launchPath: '/preview/preview-session-1',
          createdAt: '2026-03-22T00:00:00.000Z',
          expiresAt: '2026-03-22T01:00:00.000Z'
        },
        accessToken: 'preview-access-token',
        user: {
          id: 'user-1',
          email: 'member@example.com',
          firstName: 'Member',
          lastName: 'User',
          tenant: {
            id: 'tenant-1',
            name: 'Tenant One'
          },
          roles: ['member'],
          permissions: ['member.view'],
          landingContext: 'member',
          session: {
            personaType: 'end_user',
            type: 'end_user',
            tenantId: 'tenant-1',
            roles: ['member'],
            permissions: ['member.view']
          }
        }
      }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    );
  }) as typeof fetch;

  const response = await getPreviewStart(
    new Request('http://localhost/api/admin-preview/start/opaque-artifact'),
    {
      params: Promise.resolve({
        artifact: 'opaque-artifact'
      })
    }
  );

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get('location'),
    'http://localhost/preview/preview-session-1'
  );
  assert.match(response.headers.get('set-cookie') ?? '', /portal-session=/);
});
