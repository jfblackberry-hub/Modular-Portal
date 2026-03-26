import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';
process.env.PAYER_PORTAL_API_AUTOSTART = 'false';

import { clearTenantContext, prisma, syncTenantTypeDefinitions } from '@payer-portal/database';

import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_TENANT_SLUG = 'audit-logging-tenant';
const TEST_USER_EMAIL = 'audit-logging-user@example.com';
const TEST_PLATFORM_ADMIN_EMAIL = 'audit-logging-platform-admin@example.com';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';

async function waitForAuditEvent(input: {
  tenantId: string;
  action: string;
  actorUserId?: string;
}) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const event = await prisma.auditLog.findFirst({
      where: {
        tenantId: input.tenantId,
        action: input.action,
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (event) {
      return event;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  return null;
}

async function cleanupTestData() {
  clearTenantContext();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_USER_EMAIL, TEST_PLATFORM_ADMIN_EMAIL]
        }
      }
    }
  });

  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_USER_EMAIL, TEST_PLATFORM_ADMIN_EMAIL]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_USER_EMAIL, TEST_PLATFORM_ADMIN_EMAIL]
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: TEST_TENANT_SLUG
    }
  });
}

beforeEach(async () => {
  clearTenantContext();
  await cleanupTestData();
});

after(async () => {
  clearTenantContext();
  await cleanupTestData();
  await prisma.$disconnect();
});

async function createPlatformAdminUser(tenantId: string) {
  await syncTenantTypeDefinitions(prisma);

  const platformAdminRole = await prisma.role.upsert({
    where: {
      code: TEST_PLATFORM_ADMIN_ROLE_CODE
    },
    update: {
      name: 'Platform Admin',
      isPlatformRole: true,
      appliesToAllTenantTypes: true
    },
    create: {
      code: TEST_PLATFORM_ADMIN_ROLE_CODE,
      name: 'Platform Admin',
      isPlatformRole: true,
      appliesToAllTenantTypes: true
    }
  });

  const platformAdminUser = await prisma.user.create({
    data: {
      tenantId,
      email: TEST_PLATFORM_ADMIN_EMAIL,
      firstName: 'Platform',
      lastName: 'Auditor',
      status: 'ACTIVE'
    }
  });

  await prisma.userRole.create({
    data: {
      userId: platformAdminUser.id,
      roleId: platformAdminRole.id,
      tenantId: null
    }
  });

  await prisma.userTenantMembership.create({
    data: {
      userId: platformAdminUser.id,
      tenantId,
      isDefault: true,
      isTenantAdmin: true,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });

  return platformAdminUser;
}

test('authentication failures are audited with tenant and request metadata', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Audit Logging Tenant',
      slug: TEST_TENANT_SLUG,
      type: 'PAYER',
      tenantTypeCode: 'PAYER',
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const { buildServer } = await import('../src/server.js');
  const app = buildServer();

  const response = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      authorization: 'Bearer invalid-token',
      'x-tenant-id': tenant.id,
      'user-agent': 'audit-logging-test'
    }
  });

  assert.equal(response.statusCode, 401, response.body);

  const auditEvent = await waitForAuditEvent({
    tenantId: tenant.id,
    action: 'auth.authentication.failed'
  });

  assert.ok(auditEvent);
  assert.equal(auditEvent.entityType, 'route');
  assert.equal(auditEvent.entityId, '/auth/me');
  assert.equal(auditEvent.metadata?.outcome, 'authentication_failed');
  assert.deepEqual(auditEvent.metadata?.request, {
    correlationId: response.headers['x-correlation-id'],
    method: 'GET',
    route: '/auth/me',
    statusCode: 401
  });
  assert.equal(auditEvent.metadata?.observability?.tenantId, tenant.id);

  await app.close();
});

test('sensitive member reads are audited', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Audit Logging Tenant',
      slug: TEST_TENANT_SLUG,
      type: 'PAYER',
      tenantTypeCode: 'PAYER',
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: TEST_USER_EMAIL,
      firstName: 'Audit',
      lastName: 'Member',
      status: 'ACTIVE'
    }
  });

  await prisma.userTenantMembership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      isDefault: true,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });

  const token = createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: tenant.id,
    sessionType: 'end_user'
  });

  const { buildServer } = await import('../src/server.js');
  const app = buildServer();

  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/member/profile',
    headers: {
      authorization: `Bearer ${token}`,
      'x-tenant-id': tenant.id,
      'user-agent': 'audit-logging-test'
    }
  });

  assert.equal(response.statusCode, 200, response.body);

  const auditEvent = await waitForAuditEvent({
    tenantId: tenant.id,
    actorUserId: user.id,
    action: 'data.member.profile.read'
  });

  assert.ok(auditEvent);
  assert.equal(auditEvent.entityType, 'member_profile');
  assert.equal(auditEvent.entityId, user.id);
  assert.equal(auditEvent.metadata?.sourceSystem, 'local-portal-db');
  assert.deepEqual(auditEvent.metadata?.request, {
    correlationId: response.headers['x-correlation-id'],
    method: 'GET',
    route: '/api/v1/member/profile'
  });
  assert.equal(auditEvent.metadata?.observability?.tenantId, tenant.id);

  await app.close();
});

test('persona session switches are audited as tenant-scoped append-only events', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Audit Logging Tenant',
      slug: TEST_TENANT_SLUG,
      type: 'PAYER',
      tenantTypeCode: 'PAYER',
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const platformAdminUser = await createPlatformAdminUser(tenant.id);
  const token = createAccessToken({
    userId: platformAdminUser.id,
    email: platformAdminUser.email,
    tenantId: 'platform',
    sessionType: 'platform_admin'
  });

  const { buildServer } = await import('../src/server.js');
  const app = buildServer();

  const response = await app.inject({
    method: 'POST',
    url: '/platform-admin/persona-sessions/events',
    headers: {
      authorization: `Bearer ${token}`,
      'x-tenant-id': tenant.id,
      'user-agent': 'audit-logging-test'
    },
    payload: {
      action: 'persona.session.focused',
      sessionId: 'persona-session-1',
      tenantId: tenant.id,
      personaType: 'tenant_admin',
      userId: 'persona-user-1'
    }
  });

  assert.equal(response.statusCode, 202, response.body);

  const auditEvent = await waitForAuditEvent({
    tenantId: tenant.id,
    actorUserId: platformAdminUser.id,
    action: 'persona.session.focused'
  });

  assert.ok(auditEvent);
  assert.equal(auditEvent.entityType, 'persona_session');
  assert.equal(auditEvent.entityId, 'persona-session-1');
  assert.equal(auditEvent.metadata?.adminSurface, 'admin_console');
  assert.equal(auditEvent.metadata?.personaType, 'tenant_admin');
  assert.equal(auditEvent.metadata?.targetUserId, 'persona-user-1');
  assert.deepEqual(auditEvent.metadata?.request, {
    correlationId: response.headers['x-correlation-id'],
    method: 'POST',
    route: '/platform-admin/persona-sessions/events',
    statusCode: 202
  });
  assert.equal(auditEvent.metadata?.observability?.tenantId, tenant.id);

  await app.close();
});
