import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import Fastify from 'fastify';
import { prisma } from '@payer-portal/database';

import { searchRoutes } from '../src/routes/search.js';

const TEST_TENANT_SLUG = 'search-test-tenant';
const TEST_OTHER_TENANT_SLUG = 'search-other-tenant';
const TEST_USER_EMAIL = 'search-user@example.com';
const TEST_OTHER_USER_EMAIL = 'search-other@example.com';

async function cleanupTestData() {
  await prisma.document.deleteMany({
    where: {
      filename: {
        in: ['eligibility-report.pdf', 'foreign-report.pdf']
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [TEST_USER_EMAIL, TEST_OTHER_USER_EMAIL]
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
}

async function createFixtureData() {
  const [tenant, otherTenant] = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'Search Tenant Alpha',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'Search Tenant Beta',
        slug: TEST_OTHER_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    })
  ]);

  const [user, otherUser] = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: TEST_USER_EMAIL,
        firstName: 'Sasha',
        lastName: 'Search'
      }
    }),
    prisma.user.create({
      data: {
        tenantId: otherTenant.id,
        email: TEST_OTHER_USER_EMAIL,
        firstName: 'Foreign',
        lastName: 'Match'
      }
    })
  ]);

  await Promise.all([
    prisma.document.create({
      data: {
        tenantId: tenant.id,
        uploadedByUserId: user.id,
        filename: 'eligibility-report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1234,
        storageKey: 'documents/search/eligibility-report.pdf',
        status: 'AVAILABLE'
      }
    }),
    prisma.document.create({
      data: {
        tenantId: otherTenant.id,
        uploadedByUserId: otherUser.id,
        filename: 'foreign-report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 4321,
        storageKey: 'documents/search/foreign-report.pdf',
        status: 'AVAILABLE'
      }
    })
  ]);

  return {
    tenant,
    user
  };
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('search endpoint returns tenant-scoped results', async () => {
  const { tenant, user } = await createFixtureData();
  const app = Fastify();
  await searchRoutes(app);

  const documentResponse = await app.inject({
    method: 'GET',
    url: '/api/search?q=eligibility',
    headers: {
      'x-user-id': user.id
    }
  });

  assert.equal(documentResponse.statusCode, 200);
  const documentPayload = documentResponse.json();
  assert.equal(documentPayload.results.documents.length, 1);
  assert.equal(documentPayload.results.documents[0].filename, 'eligibility-report.pdf');
  assert.equal(documentPayload.results.users.length, 0);

  const userResponse = await app.inject({
    method: 'GET',
    url: '/api/search?q=Sasha',
    headers: {
      'x-user-id': user.id
    }
  });

  assert.equal(userResponse.statusCode, 200);
  const userPayload = userResponse.json();
  assert.equal(userPayload.results.users.length, 1);
  assert.equal(userPayload.results.users[0].email, TEST_USER_EMAIL);

  const tenantResponse = await app.inject({
    method: 'GET',
    url: '/api/search?q=Alpha',
    headers: {
      'x-user-id': user.id
    }
  });

  assert.equal(tenantResponse.statusCode, 200);
  const tenantPayload = tenantResponse.json();
  assert.equal(tenantPayload.results.tenants.length, 1);
  assert.equal(tenantPayload.results.tenants[0].id, tenant.id);

  const isolatedResponse = await app.inject({
    method: 'GET',
    url: '/api/search?q=foreign',
    headers: {
      'x-user-id': user.id
    }
  });

  assert.equal(isolatedResponse.statusCode, 200);
  const isolatedPayload = isolatedResponse.json();
  assert.equal(isolatedPayload.results.documents.length, 0);
  assert.equal(isolatedPayload.results.users.length, 0);
  assert.equal(isolatedPayload.results.tenants.length, 0);

  await app.close();
});
