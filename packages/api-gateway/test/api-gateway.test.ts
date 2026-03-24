import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';
process.env.API_GATEWAY_RATE_LIMIT_MAX = '1000';

import { prisma } from '@payer-portal/database';

import { buildApiGateway } from '../src/index.js';
import { createGatewayToken } from '../src/jwt.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
const TEST_TENANT_ADMIN_ROLE_CODE = 'tenant_admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'gateway-platform-admin@example.com';
const TEST_MEMBER_EMAIL = 'gateway-member@example.com';
const TEST_OTHER_MEMBER_EMAIL = 'gateway-other-member@example.com';
const TEST_TENANT_SLUG = 'gateway-test-tenant';
const TEST_OTHER_TENANT_SLUG = 'gateway-other-tenant';

async function cleanupTestData() {
  await prisma.notification.deleteMany({
    where: {
      template: {
        in: ['gateway-alert', 'gateway-self']
      }
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: [TEST_PLATFORM_ADMIN_EMAIL, TEST_MEMBER_EMAIL, TEST_OTHER_MEMBER_EMAIL]
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_PLATFORM_ADMIN_EMAIL, TEST_MEMBER_EMAIL, TEST_OTHER_MEMBER_EMAIL]
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
          in: [TEST_PLATFORM_ADMIN_ROLE_CODE, TEST_TENANT_ADMIN_ROLE_CODE]
        }
      }
    }
  });

  await prisma.role.deleteMany({
    where: {
      code: {
        in: [TEST_PLATFORM_ADMIN_ROLE_CODE, TEST_TENANT_ADMIN_ROLE_CODE]
      }
    }
  });
}

async function createFixtureData() {
  const permission = await prisma.permission.upsert({
    where: { code: TEST_PERMISSION_CODE },
    update: { name: 'Admin Manage' },
    create: {
      code: TEST_PERMISSION_CODE,
      name: 'Admin Manage'
    }
  });

  const [tenant, otherTenant] = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'Gateway Tenant',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Gateway Other Tenant',
        slug: TEST_OTHER_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    })
  ]);

  const [platformRole, tenantRole] = await Promise.all([
    prisma.role.upsert({
      where: { code: TEST_PLATFORM_ADMIN_ROLE_CODE },
      update: { name: 'Platform Admin' },
      create: {
        code: TEST_PLATFORM_ADMIN_ROLE_CODE,
        name: 'Platform Admin'
      }
    }),
    prisma.role.upsert({
      where: { code: TEST_TENANT_ADMIN_ROLE_CODE },
      update: { name: 'Tenant Admin' },
      create: {
        code: TEST_TENANT_ADMIN_ROLE_CODE,
        name: 'Tenant Admin'
      }
    })
  ]);

  await prisma.rolePermission.create({
    data: {
      roleId: tenantRole.id,
      permissionId: permission.id
    }
  });

  const [platformAdminUser, memberUser, otherMemberUser] = await Promise.all([
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
        email: TEST_MEMBER_EMAIL,
        firstName: 'Tenant',
        lastName: 'Member'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_OTHER_MEMBER_EMAIL,
        firstName: 'Other',
        lastName: 'Member'
      }
    })
  ]);

  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: platformAdminUser.id,
        roleId: platformRole.id
      }
    }),
    prisma.userRole.create({
      data: {
        userId: memberUser.id,
        roleId: tenantRole.id
      }
    })
  ]);

  return {
    tenant,
    otherTenant,
    platformAdminUser,
    memberUser,
    otherMemberUser
  };
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('gateway enforces JWT auth, tenant scoping, and serves OpenAPI', async () => {
  const { tenant, otherTenant, platformAdminUser, memberUser, otherMemberUser } =
    await createFixtureData();
  const app = buildApiGateway();

  const livenessResponse = await app.inject({
    method: 'GET',
    url: '/liveness'
  });
  const readinessResponse = await app.inject({
    method: 'GET',
    url: '/readiness'
  });
  const healthResponse = await app.inject({
    method: 'GET',
    url: '/health'
  });

  assert.equal(livenessResponse.statusCode, 200);
  assert.equal(livenessResponse.json().service, 'api-gateway');
  assert.equal(readinessResponse.statusCode, 200);
  assert.equal(readinessResponse.json().service, 'api-gateway');
  assert.equal(healthResponse.statusCode, 200);
  assert.equal(healthResponse.json().service, 'api-gateway');

  const unauthorizedResponse = await app.inject({
    method: 'GET',
    url: '/api/v1/search?q=test'
  });

  assert.equal(unauthorizedResponse.statusCode, 401);

  const openApiResponse = await app.inject({
    method: 'GET',
    url: '/api/v1/openapi.json'
  });

  assert.equal(openApiResponse.statusCode, 200);
  assert.equal(openApiResponse.json().openapi.info.title, 'Payer Portal API Gateway');

  const platformToken = createGatewayToken({
    id: platformAdminUser.id,
    email: platformAdminUser.email,
    tenant: { id: tenant.id },
    roles: ['platform_admin'],
    permissions: []
  });

  const usersResponse = await app.inject({
    method: 'GET',
    url: '/api/v1/users',
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(usersResponse.statusCode, 200, usersResponse.body);
  assert.ok(
    usersResponse
      .json()
      .some((user: { id: string }) => user.id === platformAdminUser.id)
  );

  const tenantAdminToken = createGatewayToken({
    id: memberUser.id,
    email: memberUser.email,
    tenant: { id: tenant.id },
    roles: ['tenant_admin'],
    permissions: ['admin.manage']
  });

  const selfNotificationResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/notifications',
    headers: {
      authorization: `Bearer ${tenantAdminToken}`
    },
    payload: {
      channel: 'IN_APP',
      template: 'gateway-self',
      body: 'Gateway self notification'
    }
  });

  assert.equal(selfNotificationResponse.statusCode, 201, selfNotificationResponse.body);
  assert.equal(selfNotificationResponse.headers['x-tenant-id'], tenant.id);

  const crossTenantResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/notifications',
    headers: {
      authorization: `Bearer ${tenantAdminToken}`,
      'x-tenant-id': otherTenant.id
    },
    payload: {
      channel: 'IN_APP',
      template: 'gateway-alert',
      body: 'Cross tenant notification',
      userId: otherMemberUser.id
    }
  });

  assert.equal(crossTenantResponse.statusCode, 403, crossTenantResponse.body);

  const platformScopedResponse = await app.inject({
    method: 'POST',
    url: '/api/v1/notifications',
    headers: {
      authorization: `Bearer ${platformToken}`,
      'x-tenant-id': otherTenant.id
    },
    payload: {
      channel: 'IN_APP',
      template: 'gateway-alert',
      body: 'Platform scoped notification',
      userId: otherMemberUser.id
    }
  });

  assert.equal(platformScopedResponse.statusCode, 201, platformScopedResponse.body);
  assert.equal(platformScopedResponse.headers['x-tenant-id'], otherTenant.id);

  const notificationListResponse = await app.inject({
    method: 'GET',
    url: '/api/notifications',
    headers: {
      authorization: `Bearer ${tenantAdminToken}`
    }
  });

  assert.equal(notificationListResponse.statusCode, 200, notificationListResponse.body);
  assert.equal(notificationListResponse.json().length, 1);

  await app.close();
});
