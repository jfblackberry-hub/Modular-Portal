import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { billingEnrollmentRoutes } from '../src/routes/billing-enrollment.js';
import { connectorRoutes } from '../src/routes/connectors.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_ADMIN_ROLE_CODE = 'test-guardrail-admin';
const TEST_MEMBER_ROLE_CODE = 'test-guardrail-member';
const TEST_TENANT_SLUG = 'guardrail-tenant-alpha';
const TEST_OTHER_TENANT_SLUG = 'guardrail-tenant-beta';
const TEST_ADMIN_EMAIL = 'guardrail-admin@example.com';
const TEST_MEMBER_EMAIL = 'guardrail-member@example.com';
const TEST_FOREIGN_EMAIL = 'guardrail-foreign@example.com';
const TEST_FOREIGN_CONNECTOR_NAME = 'Guardrail Foreign Connector';
const TEST_FOREIGN_ORG_UNIT_NAME = 'Guardrail Foreign Department';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });

  await prisma.organizationUnit.deleteMany({
    where: {
      name: TEST_FOREIGN_ORG_UNIT_NAME
    }
  });

  await prisma.connectorConfig.deleteMany({
    where: {
      name: TEST_FOREIGN_CONNECTOR_NAME
    }
  });

  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_ADMIN_EMAIL, TEST_MEMBER_EMAIL, TEST_FOREIGN_EMAIL]
        }
      }
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_ADMIN_EMAIL, TEST_MEMBER_EMAIL, TEST_FOREIGN_EMAIL]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_ADMIN_EMAIL, TEST_MEMBER_EMAIL, TEST_FOREIGN_EMAIL]
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
        name: 'Guardrail Tenant Alpha',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Guardrail Tenant Beta',
        slug: TEST_OTHER_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    })
  ]);

  const [adminRole, memberRole] = await Promise.all([
    prisma.role.upsert({
      where: {
        code: TEST_ADMIN_ROLE_CODE
      },
      update: {
        name: 'Guardrail Tenant Admin'
      },
      create: {
        code: TEST_ADMIN_ROLE_CODE,
        name: 'Guardrail Tenant Admin'
      }
    }),
    prisma.role.upsert({
      where: {
        code: TEST_MEMBER_ROLE_CODE
      },
      update: {
        name: 'Guardrail Tenant Member'
      },
      create: {
        code: TEST_MEMBER_ROLE_CODE,
        name: 'Guardrail Tenant Member'
      }
    })
  ]);

  await prisma.rolePermission.create({
    data: {
      roleId: adminRole.id,
      permissionId: permission.id
    }
  });

  const [adminUser, memberUser, foreignUser] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_ADMIN_EMAIL,
        firstName: 'Guardrail',
        lastName: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_MEMBER_EMAIL,
        firstName: 'Guardrail',
        lastName: 'Member'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_FOREIGN_EMAIL,
        firstName: 'Guardrail',
        lastName: 'Foreign'
      }
    })
  ]);

  await prisma.userRole.createMany({
    data: [
      {
        userId: adminUser.id,
        roleId: adminRole.id
      },
      {
        userId: memberUser.id,
        roleId: memberRole.id
      }
    ]
  });

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
        tenantId: tenant.id,
        isDefault: true,
        isTenantAdmin: false
      },
      {
        userId: foreignUser.id,
        tenantId: otherTenant.id,
        isDefault: true,
        isTenantAdmin: false
      }
    ]
  });

  const [foreignConnector, foreignOrgUnit] = await Promise.all([
    prisma.connectorConfig.create({
      data: {
        tenantId: otherTenant.id,
        adapterKey: 'local-file',
        name: TEST_FOREIGN_CONNECTOR_NAME,
        status: 'ACTIVE',
        config: {
          directoryPath: '/tmp/guardrail-foreign'
        }
      }
    }),
    prisma.organizationUnit.create({
      data: {
        tenantId: otherTenant.id,
        type: 'DEPARTMENT',
        name: TEST_FOREIGN_ORG_UNIT_NAME
      }
    })
  ]);

  return {
    adminUser,
    memberUser,
    tenant,
    otherTenant,
    foreignConnector,
    foreignOrgUnit
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

test('cross-tenant connector access attempts fail without enqueuing work', async () => {
  const { adminUser, tenant, foreignConnector } = await createFixtureData();
  const app = Fastify();
  await connectorRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const response = await app.inject({
    method: 'POST',
    url: `/api/connectors/${foreignConnector.id}/sync`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(response.statusCode, 404, response.body);
  assert.match(response.body, /Connector not found/i);

  const queuedJobs = await prisma.job.count({
    where: {
      type: 'connector.sync',
      tenantId: tenant.id
    }
  });

  assert.equal(queuedJobs, 0);

  await app.close();
});

test('unauthorized capability access to billing enrollment routes fails', async () => {
  const { memberUser, tenant } = await createFixtureData();
  const app = Fastify();
  await billingEnrollmentRoutes(app);
  const memberToken = createEndUserToken(memberUser, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/billing-enrollment/employer/dashboard',
    headers: {
      authorization: `Bearer ${memberToken}`
    }
  });

  assert.equal(response.statusCode, 403, response.body);
  assert.match(
    response.body,
    /Billing & Enrollment access requires an authorized module role or billing enrollment permission/i
  );

  await app.close();
});

test('invalid orgUnitId usage is rejected for tenant-scoped routes', async () => {
  const { adminUser, tenant, foreignOrgUnit } = await createFixtureData();
  const app = Fastify();
  await connectorRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: `/api/connectors?orgUnitId=${foreignOrgUnit.id}`,
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(response.statusCode, 403, response.body);
  assert.match(
    response.body,
    /organization unit is not accessible/i
  );

  await app.close();
});
