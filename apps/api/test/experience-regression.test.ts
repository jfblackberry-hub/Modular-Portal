import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { connectorRoutes } from '../src/routes/connectors.js';
import { searchRoutes } from '../src/routes/search.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const EXPERIENCE_FIXTURES = [
  {
    key: 'member',
    tenantType: 'MEMBER' as const,
    roleCode: 'member',
    roleName: 'Member',
    tenantSlug: 'regression-member-tenant',
    tenantName: 'Regression Member Tenant',
    email: 'regression-member@example.com',
    fileName: 'member-exclusive-report.pdf',
    searchTerm: 'member-exclusive'
  },
  {
    key: 'employer',
    tenantType: 'EMPLOYER' as const,
    roleCode: 'employer_group_admin',
    roleName: 'Employer Group Admin',
    tenantSlug: 'regression-employer-tenant',
    tenantName: 'Regression Employer Tenant',
    email: 'regression-employer@example.com',
    fileName: 'employer-exclusive-report.pdf',
    searchTerm: 'employer-exclusive'
  },
  {
    key: 'broker',
    tenantType: 'BROKER' as const,
    roleCode: 'broker',
    roleName: 'Broker',
    tenantSlug: 'regression-broker-tenant',
    tenantName: 'Regression Broker Tenant',
    email: 'regression-broker@example.com',
    fileName: 'broker-exclusive-report.pdf',
    searchTerm: 'broker-exclusive'
  },
  {
    key: 'provider',
    tenantType: 'PROVIDER' as const,
    roleCode: 'provider',
    roleName: 'Provider',
    tenantSlug: 'regression-provider-tenant',
    tenantName: 'Regression Provider Tenant',
    email: 'regression-provider@example.com',
    fileName: 'provider-exclusive-report.pdf',
    searchTerm: 'provider-exclusive'
  }
];

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });

  await prisma.document.deleteMany({
    where: {
      filename: {
        in: EXPERIENCE_FIXTURES.map((fixture) => fixture.fileName)
      }
    }
  });

  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: {
          in: EXPERIENCE_FIXTURES.map((fixture) => fixture.email)
        }
      }
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: EXPERIENCE_FIXTURES.map((fixture) => fixture.email)
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: EXPERIENCE_FIXTURES.map((fixture) => fixture.email)
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: EXPERIENCE_FIXTURES.map((fixture) => fixture.tenantSlug)
      }
    }
  });

  await prisma.role.deleteMany({
    where: {
      code: {
        in: EXPERIENCE_FIXTURES.map((fixture) => fixture.roleCode)
      }
    }
  });
}

async function createFixtureData() {
  const roles = await Promise.all(
    EXPERIENCE_FIXTURES.map((fixture) =>
      prisma.role.upsert({
        where: {
          code: fixture.roleCode
        },
        update: {
          name: fixture.roleName
        },
        create: {
          code: fixture.roleCode,
          name: fixture.roleName
        }
      })
    )
  );

  const fixtures = [];

  for (const [index, fixture] of EXPERIENCE_FIXTURES.entries()) {
    const role = roles[index];
    const tenant = await prisma.tenant.create({
      data: {
        name: fixture.tenantName,
        slug: fixture.tenantSlug,
        status: 'ACTIVE',
        type: fixture.tenantType,
        brandingConfig: {}
      }
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: fixture.email,
        firstName: fixture.roleName,
        lastName: 'Regression'
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
        isTenantAdmin: false
      }
    });

    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        uploadedByUserId: user.id,
        filename: fixture.fileName,
        mimeType: 'application/pdf',
        sizeBytes: 1024 + index,
        storageKey: `documents/regression/${fixture.fileName}`,
        status: 'AVAILABLE'
      }
    });

    fixtures.push({
      ...fixture,
      tenant,
      user
    });
  }

  return fixtures;
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

test('search remains tenant-scoped across member, employer, broker, and provider experiences', async () => {
  const fixtures = await createFixtureData();
  const app = Fastify();
  await searchRoutes(app);

  for (const fixture of fixtures) {
    const token = createEndUserToken(fixture.user, fixture.tenant.id);
    const foreignFixture = fixtures.find((candidate) => candidate.key !== fixture.key);

    const ownDocumentResponse = await app.inject({
      method: 'GET',
      url: `/api/search?q=${fixture.searchTerm}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(
      ownDocumentResponse.statusCode,
      200,
      `${fixture.key}: ${ownDocumentResponse.body}`
    );
    assert.deepEqual(
      ownDocumentResponse.json().results.documents.map(
        (document: { filename: string }) => document.filename
      ),
      [fixture.fileName]
    );

    const ownTenantResponse = await app.inject({
      method: 'GET',
      url: `/api/search?q=${encodeURIComponent(fixture.tenantName)}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(
      ownTenantResponse.statusCode,
      200,
      `${fixture.key}: ${ownTenantResponse.body}`
    );
    assert.deepEqual(
      ownTenantResponse.json().results.tenants.map(
        (tenant: { id: string }) => tenant.id
      ),
      [fixture.tenant.id]
    );

    const foreignSearchResponse = await app.inject({
      method: 'GET',
      url: `/api/search?q=${foreignFixture?.searchTerm ?? 'no-match'}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(
      foreignSearchResponse.statusCode,
      200,
      `${fixture.key}: ${foreignSearchResponse.body}`
    );
    assert.equal(foreignSearchResponse.json().results.documents.length, 0);
    assert.equal(foreignSearchResponse.json().results.users.length, 0);
    assert.equal(foreignSearchResponse.json().results.tenants.length, 0);
  }

  await app.close();
});

test('connector admin routes stay closed to end-user sessions across all experiences', async () => {
  const fixtures = await createFixtureData();
  const app = Fastify();
  await connectorRoutes(app);

  for (const fixture of fixtures) {
    const token = createEndUserToken(fixture.user, fixture.tenant.id);
    const response = await app.inject({
      method: 'GET',
      url: '/api/connectors',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    assert.equal(response.statusCode, 403, `${fixture.key}: ${response.body}`);
  }

  await app.close();
});
