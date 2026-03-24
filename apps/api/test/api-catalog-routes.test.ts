import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { apiCatalogRoutes } from '../src/routes/api-catalog.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const TEST_PLATFORM_ADMIN_EMAIL = 'api-catalog-platform-admin@example.com';
const TEST_TENANT_ADMIN_EMAIL = 'api-catalog-tenant-admin@example.com';
const TEST_TENANT_SLUG = 'api-catalog-tenant';
const TEST_OTHER_TENANT_SLUG = 'api-catalog-other-tenant';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.apiCatalogEntry.deleteMany({
    where: {
      slug: {
        in: [
          'tenant-only-claims-api',
          'other-tenant-pharmacy-api',
          'clinical-tenant-insights-api'
        ]
      }
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

  await prisma.userTenantMembership.deleteMany({
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
      slug: {
        in: [TEST_TENANT_SLUG, TEST_OTHER_TENANT_SLUG]
      }
    }
  });
}

async function createFixtureData() {
  const platformAdminRole = await prisma.role.upsert({
    where: {
      code: 'platform_admin'
    },
    update: {
      name: 'Platform Admin'
    },
    create: {
      code: 'platform_admin',
      name: 'Platform Admin'
    }
  });

  const [tenant, otherTenant] = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'API Catalog Tenant',
        slug: TEST_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    }),
    prisma.tenant.create({
      data: {
        name: 'API Catalog Other Tenant',
        slug: TEST_OTHER_TENANT_SLUG,
        status: 'ACTIVE',
        brandingConfig: {}
      }
    })
  ]);

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
    prisma.userTenantMembership.createMany({
      data: [
        {
          userId: platformAdminUser.id,
          tenantId: tenant.id,
          isDefault: true,
          isTenantAdmin: true
        },
        {
          userId: tenantAdminUser.id,
          tenantId: tenant.id,
          isDefault: true,
          isTenantAdmin: true
        }
      ]
    })
  ]);

  await prisma.apiCatalogEntry.createMany({
    data: [
      {
        slug: 'tenant-only-claims-api',
        name: 'Tenant Only Claims API',
        category: 'CLAIMS',
        vendor: 'Tenant Claims Systems',
        description: 'Only available for the primary test tenant.',
        endpoint: '/claims/v1/tenant-only',
        version: 'v1',
        inputModels: ['TenantClaimsRequest'],
        outputModels: ['TenantClaimsResponse'],
        tenantAvailability: [tenant.id],
        sortOrder: 110
      },
      {
        slug: 'other-tenant-pharmacy-api',
        name: 'Other Tenant Pharmacy API',
        category: 'PHARMACY',
        vendor: 'Other Tenant Rx',
        description: 'Only available for the secondary test tenant.',
        endpoint: '/pharmacy/v1/other-tenant',
        version: 'v1',
        inputModels: ['OtherTenantPharmacyRequest'],
        outputModels: ['OtherTenantPharmacyResponse'],
        tenantAvailability: [otherTenant.id],
        sortOrder: 120
      },
      {
        slug: 'clinical-tenant-insights-api',
        name: 'Clinical Tenant Insights API',
        category: 'CLINICAL',
        vendor: 'Clinical Fabric',
        description: 'Clinical visibility endpoint for the primary tenant.',
        endpoint: '/clinical/v1/tenant-insights',
        version: 'v3',
        inputModels: ['ClinicalInsightsRequest'],
        outputModels: ['ClinicalInsightsResponse'],
        tenantAvailability: [tenant.id],
        sortOrder: 130
      }
    ]
  });

  return {
    tenant,
    platformAdminUser,
    tenantAdminUser
  };
}

function createPlatformAdminToken(user: { id: string; email: string }) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: 'platform',
    sessionType: 'platform_admin'
  });
}

function createTenantAdminToken(user: { id: string; email: string }, tenantId: string) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'tenant_admin'
  });
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('api catalog returns all entries for platform admins and supports category filtering', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await apiCatalogRoutes(app);
  const token = createPlatformAdminToken(platformAdminUser);

  const response = await app.inject({
    method: 'GET',
    url: '/api-catalog?category=pharmacy',
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json() as Array<{
    category: string;
    slug: string;
  }>;
  assert.ok(payload.length >= 2);
  assert.ok(payload.every((entry) => entry.category === 'pharmacy'));
  assert.ok(payload.some((entry) => entry.slug === 'pharmacy-benefits'));
  assert.ok(payload.some((entry) => entry.slug === 'other-tenant-pharmacy-api'));

  await app.close();
});

test('api catalog returns marketplace metadata for visible entries', async () => {
  const { tenant, tenantAdminUser } = await createFixtureData();
  const app = Fastify();
  await apiCatalogRoutes(app);
  const token = createTenantAdminToken(tenantAdminUser, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: '/api-catalog?category=clinical',
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json() as Array<{
    category: string;
    inputModels: string[];
    outputModels: string[];
    slug: string;
    vendor: string;
  }>;
  assert.ok(payload.length >= 1);
  const tenantClinicalEntry = payload.find(
    (entry) => entry.slug === 'clinical-tenant-insights-api'
  );
  assert.ok(tenantClinicalEntry);
  assert.equal(tenantClinicalEntry.category, 'clinical');
  assert.equal(tenantClinicalEntry.vendor, 'Clinical Fabric');
  assert.deepEqual(tenantClinicalEntry.inputModels, ['ClinicalInsightsRequest']);
  assert.deepEqual(tenantClinicalEntry.outputModels, ['ClinicalInsightsResponse']);

  await app.close();
});

test('api catalog only returns entries available to the current tenant for tenant admins', async () => {
  const { tenant, tenantAdminUser } = await createFixtureData();
  const app = Fastify();
  await apiCatalogRoutes(app);
  const token = createTenantAdminToken(tenantAdminUser, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: '/api-catalog',
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json() as Array<{
    slug: string;
  }>;
  assert.ok(payload.some((entry) => entry.slug === 'tenant-only-claims-api'));
  assert.ok(payload.some((entry) => entry.slug === 'claims-adjudication'));
  assert.equal(
    payload.some((entry) => entry.slug === 'other-tenant-pharmacy-api'),
    false
  );

  await app.close();
});

test('api catalog rejects unsupported categories', async () => {
  const { platformAdminUser } = await createFixtureData();
  const app = Fastify();
  await apiCatalogRoutes(app);
  const token = createPlatformAdminToken(platformAdminUser);

  const response = await app.inject({
    method: 'GET',
    url: '/api-catalog?category=prior-auth',
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 400, response.body);
  assert.match(response.body, /Invalid category/);

  await app.close();
});
