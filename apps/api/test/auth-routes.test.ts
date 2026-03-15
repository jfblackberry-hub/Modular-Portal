import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import Fastify from 'fastify';
import { prisma } from '@payer-portal/database';

import { authRoutes } from '../src/routes/auth.js';

const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform-admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'auth-me-platform-admin@example.com';
const TEST_TENANT_SLUG = 'auth-me-platform-tenant';

async function cleanupTestData() {
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: TEST_PLATFORM_ADMIN_EMAIL
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: TEST_PLATFORM_ADMIN_EMAIL
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: TEST_TENANT_SLUG
    }
  });
}

async function createFixtureData() {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Auth Me Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const role = await prisma.role.upsert({
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
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: TEST_PLATFORM_ADMIN_EMAIL,
      firstName: 'Auth',
      lastName: 'Tester'
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id
    }
  });

  return { tenant, user };
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('auth me returns current user role context', async () => {
  const { user, tenant } = await createFixtureData();
  const app = Fastify();
  await authRoutes(app);

  const response = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      'x-user-id': user.id
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json();
  assert.equal(payload.id, user.id);
  assert.equal(payload.tenantId, tenant.id);
  assert.equal(payload.isPlatformAdmin, true);
  assert.equal(payload.roles.includes(TEST_PLATFORM_ADMIN_ROLE_CODE), true);

  await app.close();
});
