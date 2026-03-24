import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { jobRoutes } from '../src/routes/jobs.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_TYPE = 'test.api.retry';
const TEST_PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
const TEST_PLATFORM_ADMIN_EMAIL = 'jobs-platform-admin@example.com';
const TEST_TENANT_SLUG = 'jobs-platform-admin-tenant';

async function cleanupJobs() {
  await prisma.job.deleteMany({
    where: {
      type: TEST_TYPE
    }
  });
}

async function cleanupFixtureData() {
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

async function createPlatformAdminUser() {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Jobs Platform Admin Tenant',
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
      firstName: 'Jobs',
      lastName: 'Admin'
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id
    }
  });

  await prisma.userTenantMembership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      isDefault: true,
      isTenantAdmin: true
    }
  });

  return user;
}

function createPlatformAdminToken(user: { id: string; email: string }) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: 'platform',
    sessionType: 'platform_admin'
  });
}

beforeEach(async () => {
  await cleanupJobs();
  await cleanupFixtureData();
});

after(async () => {
  await cleanupJobs();
  await cleanupFixtureData();
  await prisma.$disconnect();
});

test('retry endpoint resets failed job to pending', async () => {
  const platformAdminUser = await createPlatformAdminUser();
  const job = await prisma.job.create({
    data: {
      type: TEST_TYPE,
      payload: {
        retry: true
      },
      status: 'FAILED',
      attempts: 3,
      maxAttempts: 3,
      lastError: 'failed before'
    }
  });

  const app = Fastify();
  await jobRoutes(app);
  const platformToken = createPlatformAdminToken(platformAdminUser);

  const response = await app.inject({
    method: 'POST',
    url: `/api/jobs/${job.id}/retry`,
    headers: {
      authorization: `Bearer ${platformToken}`
    }
  });

  assert.equal(response.statusCode, 200);

  const payload = response.json();
  assert.equal(payload.status, 'PENDING');
  assert.equal(payload.attempts, 0);
  assert.equal(payload.lastError, null);

  const stored = await prisma.job.findUnique({
    where: { id: job.id }
  });

  assert.equal(stored?.status, 'PENDING');
  assert.equal(stored?.attempts, 0);
  assert.equal(stored?.lastError, null);

  await app.close();
});
