import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { hashPassword, prisma, syncTenantTypeDefinitions } from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';

async function cleanupProvisionedAuthFixtures() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
  await prisma.previewSession.deleteMany();
  await prisma.portalAuthHandoff.deleteMany();
  await prisma.userCredential.deleteMany({
    where: {
      user: {
        email: {
          contains: '@auth.test'
        }
      }
    }
  });
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          contains: '@auth.test'
        }
      }
    }
  });
  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: {
          contains: '@auth.test'
        }
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@auth.test'
      }
    }
  });
  await prisma.role.deleteMany({
    where: {
      code: {
        in: ['auth_member', 'clinic_manager', 'tenant_admin']
      }
    }
  });
  await prisma.permission.deleteMany({
    where: {
      code: {
        in: ['member.view', 'provider.view', 'tenant.view', 'user.manage']
      }
    }
  });
  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: ['auth-payer-tenant', 'auth-provider-tenant']
      }
    }
  });
}

async function provisionAuthUser(input: {
  tenant: {
    slug: string;
    name: string;
    type: 'PAYER' | 'PROVIDER';
  };
  user: {
    email: string;
    firstName: string;
    lastName: string;
    roleCode: string;
    roleName: string;
    permissions: string[];
    isTenantAdmin?: boolean;
  };
}) {
  await syncTenantTypeDefinitions(prisma);

  const tenant = await prisma.tenant.create({
    data: {
      name: input.tenant.name,
      slug: input.tenant.slug,
      type: input.tenant.type,
      tenantTypeCode: input.tenant.type,
      status: 'ACTIVE',
      isActive: true,
      brandingConfig: {}
    }
  });

  const permissions = await Promise.all(
    input.user.permissions.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {
          name: code
        },
        create: {
          code,
          name: code
        }
      })
    )
  );

  const role = await prisma.role.create({
    data: {
      code: input.user.roleCode,
      name: input.user.roleName,
      tenantTypeCode: input.tenant.type,
      appliesToAllTenantTypes: input.user.roleCode === 'tenant_admin'
    }
  });

  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id
      }
    });
  }

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: input.user.email,
      firstName: input.user.firstName,
      lastName: input.user.lastName,
      isActive: true,
      status: 'ACTIVE'
    }
  });

  await prisma.userCredential.create({
    data: {
      userId: user.id,
      passwordHash: hashPassword('demo12345'),
      passwordSetAt: new Date()
    }
  });

  await prisma.userTenantMembership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      isDefault: true,
      isTenantAdmin: input.user.isTenantAdmin ?? false,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      tenantId: tenant.id
    }
  });

  return { tenant, user, role };
}

beforeEach(async () => {
  await cleanupProvisionedAuthFixtures();
});

after(async () => {
  await cleanupProvisionedAuthFixtures();
  await prisma.$disconnect();
});

test('auth login uses persisted credentials for seeded users', async () => {
  await provisionAuthUser({
    tenant: {
      slug: 'auth-payer-tenant',
      name: 'Auth Payer Tenant',
      type: 'PAYER'
    },
    user: {
      email: 'maria@auth.test',
      firstName: 'Maria',
      lastName: 'Lopez',
      roleCode: 'auth_member',
      roleName: 'Member',
      permissions: ['member.view']
    }
  });

  const app = Fastify();
  await authRoutes(app);

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'maria@auth.test',
      password: 'demo12345'
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json() as {
    user: {
      email: string;
      tenant: {
        tenantTypeCode: string;
      };
      session: {
        tenantId: string | null;
      };
    };
  };

  assert.equal(payload.user.email, 'maria@auth.test');
  assert.equal(payload.user.tenant.tenantTypeCode, 'PAYER');
  assert.equal(typeof payload.user.session.tenantId, 'string');
  assert.ok(payload.user.session.tenantId);

  await app.close();
});

test('provider login resolves through tenant type and tenant-scoped role assignments', async () => {
  await provisionAuthUser({
    tenant: {
      slug: 'auth-provider-tenant',
      name: 'Auth Provider Tenant',
      type: 'PROVIDER'
    },
    user: {
      email: 'dr.lee@auth.test',
      firstName: 'Jordan',
      lastName: 'Lee',
      roleCode: 'clinic_manager',
      roleName: 'Clinic Manager',
      permissions: ['provider.view', 'tenant.view']
    }
  });

  const app = Fastify();
  await authRoutes(app);

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login/provider',
    payload: {
      email: 'dr.lee@auth.test',
      password: 'demo12345'
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json() as {
    user: {
      landingContext: string;
      session: {
        type: string;
        tenantId: string | null;
        roles: string[];
      };
    };
  };

  assert.equal(payload.user.landingContext, 'provider');
  assert.equal(payload.user.session.type, 'end_user');
  assert.equal(typeof payload.user.session.tenantId, 'string');
  assert.ok(payload.user.session.roles.includes('clinic_manager'));

  await app.close();
});
