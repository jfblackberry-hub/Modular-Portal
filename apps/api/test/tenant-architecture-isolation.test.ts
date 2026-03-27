import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma, syncTenantTypeDefinitions } from '@payer-portal/database';
import Fastify from 'fastify';

import { searchRoutes } from '../src/routes/search.js';
import { createAccessToken } from '../src/services/access-token-service.js';

const FIXTURES = [
  {
    key: 'payer',
    tenantType: 'PAYER' as const,
    tenantSlug: 'tenant-arch-payer',
    tenantName: 'Tenant Arch Payer',
    email: 'payer.arch@test.local',
    roleCode: 'member',
    roleName: 'Member',
    documentName: 'payer-private-document.pdf',
    searchTerm: 'payer-private'
  },
  {
    key: 'clinic-a',
    tenantType: 'CLINIC' as const,
    tenantSlug: 'tenant-arch-clinic-a',
    tenantName: 'Tenant Arch Clinic A',
    email: 'clinic.a@test.local',
    roleCode: 'clinic_manager',
    roleName: 'Clinic Manager',
    documentName: 'clinic-a-private-document.pdf',
    searchTerm: 'clinic-a-private'
  },
  {
    key: 'clinic-b',
    tenantType: 'CLINIC' as const,
    tenantSlug: 'tenant-arch-clinic-b',
    tenantName: 'Tenant Arch Clinic B',
    email: 'clinic.b@test.local',
    roleCode: 'clinic_manager_b',
    roleName: 'Clinic Manager B',
    documentName: 'clinic-b-private-document.pdf',
    searchTerm: 'clinic-b-private'
  },
  {
    key: 'physician-group',
    tenantType: 'PHYSICIAN_GROUP' as const,
    tenantSlug: 'tenant-arch-physician-group',
    tenantName: 'Tenant Arch Physician Group',
    email: 'physician.group@test.local',
    roleCode: 'physician_group_ops',
    roleName: 'Physician Group Ops',
    documentName: 'physician-group-private-document.pdf',
    searchTerm: 'physician-group-private'
  },
  {
    key: 'hospital',
    tenantType: 'HOSPITAL' as const,
    tenantSlug: 'tenant-arch-hospital',
    tenantName: 'Tenant Arch Hospital',
    email: 'hospital.ops@test.local',
    roleCode: 'hospital_ops',
    roleName: 'Hospital Ops',
    documentName: 'hospital-private-document.pdf',
    searchTerm: 'hospital-private'
  }
];

async function cleanupFixtureData() {
  await prisma.document.deleteMany({
    where: {
      filename: {
        in: FIXTURES.map((fixture) => fixture.documentName)
      }
    }
  });

  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: {
          in: FIXTURES.map((fixture) => fixture.email)
        }
      }
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: FIXTURES.map((fixture) => fixture.email)
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: FIXTURES.map((fixture) => fixture.email)
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: FIXTURES.map((fixture) => fixture.tenantSlug)
      }
    }
  });

  await prisma.role.deleteMany({
    where: {
      code: {
        in: FIXTURES.map((fixture) => fixture.roleCode)
      }
    }
  });
}

async function createFixtureData() {
  await syncTenantTypeDefinitions(prisma);

  return Promise.all(
    FIXTURES.map(async (fixture) => {
      const role = await prisma.role.upsert({
        where: { code: fixture.roleCode },
        update: {
          name: fixture.roleName,
          tenantTypeCode: fixture.tenantType
        },
        create: {
          code: fixture.roleCode,
          name: fixture.roleName,
          tenantTypeCode: fixture.tenantType
        }
      });

      const tenant = await prisma.tenant.create({
        data: {
          name: fixture.tenantName,
          slug: fixture.tenantSlug,
          status: 'ACTIVE',
          type: fixture.tenantType,
          tenantTypeCode: fixture.tenantType,
          brandingConfig: {
            displayName: fixture.tenantName,
            purchasedModules:
              fixture.tenantType === 'PAYER' ? ['member_home'] : ['provider_operations']
          }
        }
      });

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: fixture.email,
          firstName: fixture.roleName,
          lastName: 'Isolation',
          isActive: true,
          status: 'ACTIVE'
        }
      });

      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          tenantId: tenant.id
        }
      });

      await prisma.userTenantMembership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          isDefault: true,
          status: 'ACTIVE'
        }
      });

      await prisma.document.create({
        data: {
          tenantId: tenant.id,
          uploadedByUserId: user.id,
          filename: fixture.documentName,
          mimeType: 'application/pdf',
          sizeBytes: 2048,
          storageKey: `documents/tenant-architecture/${fixture.documentName}`,
          status: 'AVAILABLE'
        }
      });

      return {
        ...fixture,
        tenant,
        user
      };
    })
  );
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
  await cleanupFixtureData();
});

after(async () => {
  await cleanupFixtureData();
  await prisma.$disconnect();
});

test('tenant-scoped search isolates payer, clinic, physician group, and hospital tenants from one another', async () => {
  const fixtures = await createFixtureData();
  const app = Fastify();
  await searchRoutes(app);

  for (const fixture of fixtures) {
    const token = createEndUserToken(fixture.user, fixture.tenant.id);

    const ownResponse = await app.inject({
      method: 'GET',
      url: `/api/search?q=${encodeURIComponent(fixture.searchTerm)}`,
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': fixture.tenant.id
      }
    });

    assert.equal(ownResponse.statusCode, 200, ownResponse.body);
    assert.deepEqual(
      ownResponse.json().results.documents.map((document: { filename: string }) => document.filename),
      [fixture.documentName]
    );

    for (const foreignFixture of fixtures.filter((candidate) => candidate.key !== fixture.key)) {
      const foreignResponse = await app.inject({
        method: 'GET',
        url: `/api/search?q=${encodeURIComponent(foreignFixture.searchTerm)}`,
        headers: {
          authorization: `Bearer ${token}`,
          'x-tenant-id': fixture.tenant.id
        }
      });

      assert.equal(foreignResponse.statusCode, 200, foreignResponse.body);
      assert.deepEqual(foreignResponse.json().results.documents, []);
    }
  }

  await app.close();
});
