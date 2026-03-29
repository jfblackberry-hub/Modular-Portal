import assert from 'node:assert/strict';
import { test } from 'node:test';

import { POST } from '../app/api/auth/session/handoff/route';
import { createAdminSessionHandoffArtifact } from '../lib/admin-session-handoff';

test('admin session handoff route consumes a self-contained signed artifact', async () => {
  const artifact = createAdminSessionHandoffArtifact({
    accessToken: 'admin-token',
    session: {
      id: 'tenant-user',
      email: 'tenant@example.com',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['tenant.view'],
      isPlatformAdmin: false,
      isTenantAdmin: true
    }
  });

  const response = await POST(
    new Request('http://localhost/api/auth/session/handoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artifact,
        redirectPath: '/admin/tenants/tenant-1/organization'
      })
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    redirectPath?: string;
    session?: {
      tenantId?: string;
      isTenantAdmin?: boolean;
    };
  };

  assert.equal(payload.redirectPath, '/admin/tenants/tenant-1/organization');
  assert.equal(payload.session?.tenantId, 'tenant-1');
  assert.equal(payload.session?.isTenantAdmin, true);
  assert.match(response.headers.get('set-cookie') ?? '', /admin_session=/);
});

test('admin session handoff route replaces unsafe redirectPath with /admin', async () => {
  const artifact = createAdminSessionHandoffArtifact({
    accessToken: 'admin-token',
    session: {
      id: 'tenant-user',
      email: 'tenant@example.com',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['tenant.view'],
      isPlatformAdmin: false,
      isTenantAdmin: true
    }
  });

  const response = await POST(
    new Request('http://localhost/api/auth/session/handoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artifact,
        redirectPath: 'https://evil.com/phish'
      })
    })
  );

  assert.equal(response.status, 200);
  const payload = (await response.json()) as { redirectPath?: string };
  assert.equal(payload.redirectPath, '/admin');
});
