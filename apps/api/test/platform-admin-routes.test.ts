import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { featureFlagRoutes } from '../src/routes/feature-flags.js';
import { roleRoutes } from '../src/routes/roles.js';
import { tenantRoutes } from '../src/routes/tenants.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
const TEST_TENANT_ADMIN_ROLE_CODE = 'tenant_admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'platform-plane-admin@example.com';
const TEST_TENANT_ADMIN_EMAIL = 'platform-plane-tenant-admin@example.com';
const TEST_TENANT_SLUG = 'platform-plane-tenant';

async function cleanupTestData() {
  await prisma.featureFlag.deleteMany({
    where: {
      key: 'platform-plane.test'
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_PLATFORM_ADMIN_EMAIL, TEST_TENANT_ADMIN_EMAIL]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_PLATFORM_ADMIN_EMAIL, TEST_TENANT_ADMIN_EMAIL]
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: TEST_TENANT_SLUG
    }
  });

}

async function createFixtureData() {
  const permission = await prisma.permission.upsert({
    where: {
      code: TEST_PERMISSION_CODE
    },
    update: {
      name: 'Manage Admin'
    },
    create: {
      code: TEST_PERMISSION_CODE,
      name: 'Manage Admin'
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Platform Plane Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const [platformAdminRole, tenantAdminRole] = await Promise.all([
    prisma.role.upsert({
      where: {
        code: TEST_PLATFORM_ADMIN_ROLE_CODE
      },
      update: {
        name: 'Platform Admin'
      },
      create: {
        code: TEST_PLATFORM_ADMIN_ROLE_CODE,
        name: 'Platform Admin'
      }
    }),
    prisma.role.upsert({
      where: {
        code: TEST_TENANT_ADMIN_ROLE_CODE
      },
      update: {
        name: 'Tenant Admin'
      },
      create: {
        code: TEST_TENANT_ADMIN_ROLE_CODE,
        name: 'Tenant Admin'
      }
    })
  ]);

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: tenantAdminRole.id,
        permissionId: permission.id
      }
    },
    update: {},
    create: {
      roleId: tenantAdminRole.id,
      permissionId: permission.id
    }
  });

  const [platformAdminUser, tenantAdminUser] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_PLATFORM_ADMIN_EMAIL,
        firstName: 'Platform',
        lastName: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_TENANT_ADMIN_EMAIL,
        firstName: 'Tenant',
        lastName: 'Admin'
      }
    })
  ]);

  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: platformAdminUser.id,
        roleId: platformAdminRole.id
      }
    }),
    prisma.userRole.create({
      data: {
        userId: tenantAdminUser.id,
        roleId: tenantAdminRole.id
      }
    })
  ]);

  return {
    tenant,
    platformAdminUser,
    tenantAdminUser
  };
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('platform-admin routes are restricted to platform admins', async () => {
  const { platformAdminUser, tenantAdminUser } = await createFixtureData();
  const app = Fastify();
  await tenantRoutes(app);
  await roleRoutes(app);
  await featureFlagRoutes(app);

  const tenantListResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/tenants',
    headers: {
      'x-user-id': platformAdminUser.id
    }
  });

  assert.equal(tenantListResponse.statusCode, 200, tenantListResponse.body);

  const forbiddenTenantListResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/tenants',
    headers: {
      'x-user-id': tenantAdminUser.id
    }
  });

  assert.equal(forbiddenTenantListResponse.statusCode, 403);

  const createFlagResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/feature-flags',
    headers: {
      'x-user-id': platformAdminUser.id
    },
    payload: {
      key: 'platform-plane.test',
      enabled: true,
      tenantId: null
    }
  });

  assert.equal(createFlagResponse.statusCode, 201);

  const forbiddenRolesResponse = await app.inject({
    method: 'GET',
    url: '/platform-admin/roles',
    headers: {
      'x-user-id': tenantAdminUser.id
    }
  });

  assert.equal(forbiddenRolesResponse.statusCode, 403);

  await app.close();
});
