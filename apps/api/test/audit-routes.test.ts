import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { clearTenantContext, prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { auditRoutes } from '../src/routes/audit.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_ADMIN_ROLE_CODE = 'test-audit-admin';
const TEST_MEMBER_ROLE_CODE = 'test-audit-member';
const TEST_TENANT_SLUG = 'audit-test-tenant';
const TEST_OTHER_TENANT_SLUG = 'audit-other-tenant';
const TEST_ADMIN_EMAIL = 'audit-admin@example.com';
const TEST_MEMBER_EMAIL = 'audit-member@example.com';

async function cleanupTestData() {
  clearTenantContext();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_ADMIN_EMAIL, TEST_MEMBER_EMAIL]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_ADMIN_EMAIL, TEST_MEMBER_EMAIL]
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: [TEST_TENANT_SLUG, TEST_OTHER_TENANT_SLUG]
      }
    }
  });

  await prisma.rolePermission.deleteMany({
    where: {
      role: {
        code: {
          in: [TEST_ADMIN_ROLE_CODE, TEST_MEMBER_ROLE_CODE]
        }
      }
    }
  });

  await prisma.role.deleteMany({
    where: {
      code: {
        in: [TEST_ADMIN_ROLE_CODE, TEST_MEMBER_ROLE_CODE]
      }
    }
  });
}

async function ensurePermission() {
  return prisma.permission.upsert({
    where: { code: TEST_PERMISSION_CODE },
    update: {
      name: 'Manage Admin'
    },
    create: {
      code: TEST_PERMISSION_CODE,
      name: 'Manage Admin'
    }
  });
}

async function createFixtureData() {
  const permission = await ensurePermission();
  const [tenant, otherTenant] = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'Audit Test Tenant',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Audit Other Tenant',
        slug: TEST_OTHER_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    })
  ]);

  const [adminRole, memberRole] = await Promise.all([
    prisma.role.create({
      data: {
        code: TEST_ADMIN_ROLE_CODE,
        name: 'Audit Admin'
      }
    }),
    prisma.role.create({
      data: {
        code: TEST_MEMBER_ROLE_CODE,
        name: 'Audit Member'
      }
    })
  ]);

  await prisma.rolePermission.create({
    data: {
      roleId: adminRole.id,
      permissionId: permission.id
    }
  });

  const [adminUser, memberUser] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_ADMIN_EMAIL,
        firstName: 'Audit',
        lastName: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_MEMBER_EMAIL,
        firstName: 'Audit',
        lastName: 'Member'
      }
    })
  ]);

  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    }),
    prisma.userRole.create({
      data: {
        userId: memberUser.id,
        roleId: memberRole.id
      }
    })
  ]);

  await prisma.userTenantMembership.createMany({
    data: [
      {
        userId: adminUser.id,
        tenantId: tenant.id,
        isDefault: true,
        isTenantAdmin: true
      },
      {
        userId: memberUser.id,
        tenantId: otherTenant.id,
        isDefault: true,
        isTenantAdmin: false
      }
    ]
  });

  return {
    tenant,
    otherTenant,
    adminUser,
    memberUser
  };
}

function createTenantAdminToken(user: { id: string; email: string }, tenantId: string) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'tenant_admin'
  });
}

function createEndUserToken(user: { id: string; email: string }, tenantId: string) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'end_user'
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

test('tenant admins can query paginated audit events with filters', async () => {
  const { tenant, otherTenant, adminUser } = await createFixtureData();
  const app = Fastify();
  await auditRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const matchingEvent = await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      actorUserId: adminUser.id,
      action: 'audit.test.document.viewed',
      entityType: 'Document',
      entityId: 'document-1',
      metadata: {
        source: 'test'
      },
      createdAt: new Date('2026-03-14T10:00:00.000Z')
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        actorUserId: adminUser.id,
        action: 'audit.test.user.updated',
        entityType: 'User',
        entityId: 'user-1',
        createdAt: new Date('2026-03-13T10:00:00.000Z')
      },
      {
        tenantId: tenant.id,
        actorUserId: null,
        action: 'audit.test.document.viewed',
        entityType: 'Document',
        entityId: 'document-2',
        createdAt: new Date('2026-03-12T10:00:00.000Z')
      },
      {
        tenantId: otherTenant.id,
        actorUserId: null,
        action: 'audit.test.document.viewed',
        entityType: 'Document',
        entityId: 'document-3',
        createdAt: new Date('2026-03-14T10:00:00.000Z')
      }
    ]
  });

  const filteredResponse = await app.inject({
    method: 'GET',
    url: `/audit/events?tenant_id=${tenant.id}&user_id=${adminUser.id}&event_type=audit.test.document.viewed&resource_type=Document&date_from=2026-03-14T00:00:00.000Z&date_to=2026-03-14T23:59:59.999Z&page=1&page_size=1`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(filteredResponse.statusCode, 200);
  const filteredPayload = filteredResponse.json();
  assert.equal(filteredPayload.items.length, 1);
  assert.equal(filteredPayload.items[0].id, matchingEvent.id);
  assert.equal(filteredPayload.items[0].tenantId, tenant.id);
  assert.equal(filteredPayload.items[0].userId, adminUser.id);
  assert.equal(filteredPayload.items[0].eventType, 'audit.test.document.viewed');
  assert.equal(filteredPayload.items[0].resourceType, 'Document');
  assert.equal(filteredPayload.pagination.page, 1);
  assert.equal(filteredPayload.pagination.pageSize, 1);
  assert.equal(filteredPayload.pagination.totalCount, 1);
  assert.equal(filteredPayload.pagination.totalPages, 1);

  const paginatedResponse = await app.inject({
    method: 'GET',
    url: `/audit/events?tenant_id=${tenant.id}&page=2&page_size=1`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(paginatedResponse.statusCode, 200);
  const paginatedPayload = paginatedResponse.json();
  assert.equal(paginatedPayload.items.length, 1);
  assert.equal(paginatedPayload.pagination.page, 2);
  assert.equal(paginatedPayload.pagination.pageSize, 1);
  assert.equal(paginatedPayload.pagination.totalCount, 3);
  assert.equal(paginatedPayload.pagination.totalPages, 3);
  assert.equal(paginatedPayload.items[0].tenantId, tenant.id);

  await app.close();
});

test('audit events remain tenant-restricted and require admin access', async () => {
  const { tenant, otherTenant, adminUser, memberUser } = await createFixtureData();
  const app = Fastify();
  await auditRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);
  const memberToken = createEndUserToken(memberUser, otherTenant.id);

  await prisma.auditLog.create({
    data: {
      tenantId: otherTenant.id,
      actorUserId: memberUser.id,
      action: 'audit.test.foreign.event',
      entityType: 'Connector',
      entityId: 'foreign-1'
    }
  });

  const blockedByPermissionResponse = await app.inject({
    method: 'GET',
    url: '/audit/events',
    headers: {
      authorization: `Bearer ${memberToken}`
    }
  });

  assert.equal(blockedByPermissionResponse.statusCode, 403);

  const blockedByTenantResponse = await app.inject({
    method: 'GET',
    url: `/audit/events?tenant_id=${otherTenant.id}`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(blockedByTenantResponse.statusCode, 403);

  const scopedResponse = await app.inject({
    method: 'GET',
    url: `/audit/events?tenant_id=${tenant.id}`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(scopedResponse.statusCode, 200);
  assert.equal(scopedResponse.json().items.length, 0);

  await app.close();
});
