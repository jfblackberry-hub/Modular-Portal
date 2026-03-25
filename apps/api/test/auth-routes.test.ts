import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform-admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'auth-me-platform-admin@example.com';
const TEST_TENANT_SLUG = 'auth-me-platform-tenant';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

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
  const { user } = await createFixtureData();
  const app = Fastify();
  await authRoutes(app);
  const token = createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: 'platform',
    sessionType: 'platform_admin'
  });

  const response = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json();
  assert.equal(payload.id, user.id);
  assert.equal(payload.tenantId, 'platform');
  assert.equal(payload.isPlatformAdmin, true);
  assert.equal(payload.roles.includes(TEST_PLATFORM_ADMIN_ROLE_CODE), true);

  await app.close();
});

test('auth me resolves tenant context from the authenticated session even when x-tenant-id is present', async () => {
  const { user, tenant } = await createFixtureData();
  const app = Fastify();
  await authRoutes(app);
  const token = createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: tenant.id,
    sessionType: 'end_user'
  });

  const response = await app.inject({
    method: 'GET',
    url: '/auth/me',
    headers: {
      authorization: `Bearer ${token}`,
      'x-tenant-id': 'tenant-mismatch'
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  assert.equal(response.json().tenantId, tenant.id);

  await app.close();
});
