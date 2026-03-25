import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { connectorRoutes } from '../src/routes/connectors.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_ADMIN_ROLE_CODE = 'test-connector-admin';
const TEST_MEMBER_ROLE_CODE = 'test-connector-member';
const TEST_TENANT_SLUG = 'connector-test-tenant';
const TEST_OTHER_TENANT_SLUG = 'connector-other-tenant';
const TEST_ADMIN_EMAIL = 'connector-admin@example.com';
const TEST_MEMBER_EMAIL = 'connector-member@example.com';
const TEST_CONNECTOR_NAME = 'Tenant Eligibility Connector';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });

  await prisma.connectorConfig.deleteMany({
    where: {
      OR: [{ name: TEST_CONNECTOR_NAME }, { name: 'Should Not Update' }]
    }
  });

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
        name: 'Connector Test Tenant',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Connector Other Tenant',
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
        name: 'Connector Admin'
      }
    }),
    prisma.role.create({
      data: {
        code: TEST_MEMBER_ROLE_CODE,
        name: 'Connector Member'
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
        firstName: 'Admin',
        lastName: 'User'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_MEMBER_EMAIL,
        firstName: 'Member',
        lastName: 'User'
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
    adminUser,
    memberUser,
    tenant,
    otherTenant
  };
}

function createTenantAdminToken(
  user: { id: string; email: string },
  tenantId: string
) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'tenant_admin'
  });
}

function createEndUserToken(
  user: { id: string; email: string },
  tenantId: string
) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'end_user'
  });
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('tenant admins can manage connectors and sync jobs are enqueued with audit logs', async () => {
  const { adminUser, tenant } = await createFixtureData();
  const directoryPath = await mkdtemp(path.join(os.tmpdir(), 'connector-api-'));
  const app = Fastify();
  await connectorRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const createResponse = await app.inject({
    method: 'POST',
    url: '/api/connectors',
    headers: {
      authorization: `Bearer ${adminToken}`,
      'user-agent': 'connector-test'
    },
    payload: {
      adapterKey: 'local-file',
      name: TEST_CONNECTOR_NAME,
      status: 'ACTIVE',
      config: {
        directoryPath
      }
    }
  });

  assert.equal(createResponse.statusCode, 201);
  const createdConnector = createResponse.json();
  assert.equal(createdConnector.tenantId, tenant.id);

  const listResponse = await app.inject({
    method: 'GET',
    url: '/api/connectors',
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(listResponse.statusCode, 200);
  assert.equal(
    listResponse
      .json()
      .some(
        (connector: { id: string }) => connector.id === createdConnector.id
      ),
    true
  );

  const updateResponse = await app.inject({
    method: 'PUT',
    url: `/api/connectors/${createdConnector.id}`,
    headers: {
      authorization: `Bearer ${adminToken}`,
      'user-agent': 'connector-test'
    },
    payload: {
      status: 'DISABLED',
      name: TEST_CONNECTOR_NAME
    }
  });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.json().status, 'DISABLED');

  const healthResponse = await app.inject({
    method: 'POST',
    url: `/api/connectors/${createdConnector.id}/health`,
    headers: {
      authorization: `Bearer ${adminToken}`,
      'user-agent': 'connector-test'
    }
  });

  assert.equal(healthResponse.statusCode, 200);
  assert.equal(healthResponse.json().result.ok, true);

  const syncResponse = await app.inject({
    method: 'POST',
    url: `/api/connectors/${createdConnector.id}/sync`,
    headers: {
      authorization: `Bearer ${adminToken}`,
      'user-agent': 'connector-test'
    }
  });

  assert.equal(syncResponse.statusCode, 202);

  const storedConnector = await prisma.connectorConfig.findUniqueOrThrow({
    where: {
      id: createdConnector.id
    }
  });
  const queuedJob = await prisma.job.findUniqueOrThrow({
    where: {
      id: syncResponse.json().id
    }
  });
  const auditActions = await prisma.auditLog.findMany({
    where: {
      tenantId: tenant.id,
      actorUserId: adminUser.id,
      entityId: createdConnector.id
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  assert.equal(storedConnector.tenantId, tenant.id);
  assert.ok(storedConnector.lastHealthCheckAt);
  assert.equal(queuedJob.type, 'connector.sync');
  assert.deepEqual(
    auditActions.map((entry) => entry.action),
    [
      'connector.created',
      'connector.updated',
      'connector.health.checked',
      'connector.sync.requested'
    ]
  );

  await app.close();
});

test('non-admin users are blocked and tenant isolation is enforced', async () => {
  const { adminUser, memberUser, otherTenant } = await createFixtureData();
  const app = Fastify();
  await connectorRoutes(app);
  const adminToken = createTenantAdminToken(
    adminUser,
    adminUser.tenantId ?? ''
  );
  const memberToken = createEndUserToken(memberUser, otherTenant.id);

  const foreignConnector = await prisma.connectorConfig.create({
    data: {
      tenantId: otherTenant.id,
      adapterKey: 'local-file',
      name: 'Should Not Update',
      status: 'ACTIVE',
      config: {
        directoryPath: await mkdtemp(
          path.join(os.tmpdir(), 'connector-foreign-')
        )
      }
    }
  });

  const blockedResponse = await app.inject({
    method: 'GET',
    url: '/api/connectors',
    headers: {
      authorization: `Bearer ${memberToken}`
    }
  });

  assert.equal(blockedResponse.statusCode, 403);

  const isolatedResponse = await app.inject({
    method: 'POST',
    url: `/api/connectors/${foreignConnector.id}/sync`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(isolatedResponse.statusCode, 404);

  await app.close();
});

test('tenant-scoped connector routes reject client-supplied tenantId and foreign orgUnitId', async () => {
  const { adminUser, tenant, otherTenant } = await createFixtureData();
  const app = Fastify();
  await connectorRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const foreignOrgUnit = await prisma.organizationUnit.create({
    data: {
      tenantId: otherTenant.id,
      type: 'DEPARTMENT',
      name: 'Foreign Department'
    }
  });

  const crossTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/connectors?tenant_id=${otherTenant.id}`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(crossTenantResponse.statusCode, 400, crossTenantResponse.body);
  assert.match(
    crossTenantResponse.body,
    /Client-supplied tenantId is not allowed/i
  );

  const invalidOrgUnitResponse = await app.inject({
    method: 'GET',
    url: `/api/connectors?orgUnitId=${foreignOrgUnit.id}`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(
    invalidOrgUnitResponse.statusCode,
    403,
    invalidOrgUnitResponse.body
  );
  assert.match(
    invalidOrgUnitResponse.body,
    /organization unit is not accessible/i
  );

  await app.close();
});
