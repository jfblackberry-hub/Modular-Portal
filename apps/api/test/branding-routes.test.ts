import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { brandingRoutes } from '../src/routes/branding.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PERMISSION_CODE = 'admin.manage';
const TEST_ADMIN_ROLE_CODE = 'test-tenant-admin';
const TEST_MEMBER_ROLE_CODE = 'test-tenant-member';
const TEST_TENANT_SLUG = 'branding-test-tenant';
const TEST_OTHER_TENANT_SLUG = 'branding-other-tenant';
const TEST_ADMIN_EMAIL = 'branding-admin@example.com';
const TEST_MEMBER_EMAIL = 'branding-member@example.com';

async function cleanupTestData() {
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

  await prisma.tenantBranding.deleteMany({
    where: {
      tenant: {
        slug: {
          in: [TEST_TENANT_SLUG, TEST_OTHER_TENANT_SLUG]
        }
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
        name: 'Branding Test Tenant',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Branding Other Tenant',
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
        name: 'Branding Admin'
      }
    }),
    prisma.role.create({
      data: {
        code: TEST_MEMBER_ROLE_CODE,
        name: 'Branding Member'
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
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('get branding returns tenant-scoped defaults when no branding record exists', async () => {
  const { adminUser, tenant } = await createFixtureData();
  const app = Fastify();
  await brandingRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: '/api/branding',
    headers: {
      authorization: `Bearer ${adminToken}`
    }
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.tenantId, tenant.id);
  assert.equal(payload.displayName, tenant.name);
  assert.equal(payload.primaryColor, '#38bdf8');
  assert.equal(payload.secondaryColor, '#ffffff');
  assert.equal(payload.logoUrl, null);

  await app.close();
});

test('put branding blocks non-admin users', async () => {
  const { memberUser, otherTenant } = await createFixtureData();
  const app = Fastify();
  await brandingRoutes(app);
  const memberToken = createEndUserToken(memberUser, otherTenant.id);

  const response = await app.inject({
    method: 'PUT',
    url: '/api/branding',
    headers: {
      authorization: `Bearer ${memberToken}`
    },
    payload: {
      displayName: 'Should Fail'
    }
  });

  assert.equal(response.statusCode, 403);

  await app.close();
});

test('put branding persists tenant branding and writes audit log', async () => {
  const { adminUser, tenant } = await createFixtureData();
  const app = Fastify();
  await brandingRoutes(app);
  const adminToken = createTenantAdminToken(adminUser, tenant.id);

  const response = await app.inject({
    method: 'PUT',
    url: '/api/branding',
    headers: {
      authorization: `Bearer ${adminToken}`,
      'user-agent': 'branding-test'
    },
    payload: {
      displayName: 'Tenant Experience',
      primaryColor: '#112233',
      secondaryColor: '#ffffff',
      logoUrl: '/logos/test-logo.svg',
      faviconUrl: 'https://cdn.example.com/favicon.ico'
    }
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.tenantId, tenant.id);
  assert.equal(payload.displayName, 'Tenant Experience');
  assert.equal(payload.primaryColor, '#112233');
  assert.equal(payload.logoUrl, '/logos/test-logo.svg');

  const storedBranding = await prisma.tenantBranding.findUnique({
    where: {
      tenantId: tenant.id
    }
  });
  const storedTenant = await prisma.tenant.findUnique({
    where: {
      id: tenant.id
    }
  });
  const auditLog = await prisma.auditLog.findFirst({
    where: {
      tenantId: tenant.id,
      actorUserId: adminUser.id,
      action: 'tenant.updated'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  assert.equal(storedBranding?.displayName, 'Tenant Experience');
  assert.equal(storedBranding?.primaryColor, '#112233');
  assert.equal(storedBranding?.faviconUrl, 'https://cdn.example.com/favicon.ico');
  assert.deepEqual(storedTenant?.brandingConfig, {
    displayName: 'Tenant Experience',
    primaryColor: '#112233',
    secondaryColor: '#ffffff',
    logoUrl: '/logos/test-logo.svg',
    faviconUrl: 'https://cdn.example.com/favicon.ico'
  });
  assert.ok(auditLog);

  await app.close();
});
