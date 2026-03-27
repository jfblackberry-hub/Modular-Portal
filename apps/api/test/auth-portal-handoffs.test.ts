import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { createPortalAuthHandoffArtifact } from '@payer-portal/config/portal-handoff';
import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';
import { createAccessToken } from '../src/services/access-token-service.js';

function createFixtureSuffix(testName: string) {
  return `${testName}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`.toLowerCase();
}

const ownedTenantIds = new Set<string>();

async function withAuditLogDeletion<T>(callback: () => Promise<T>) {
  await prisma.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER USER');

  try {
    return await callback();
  } finally {
    await prisma.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER USER');
  }
}

async function cleanupOwnedFixtures() {
  const tenantIds = Array.from(ownedTenantIds);

  if (tenantIds.length === 0) {
    return;
  }

  await prisma.portalAuthHandoff.deleteMany({
    where: {
      tenantId: {
        in: tenantIds
      }
    }
  });

  await prisma.userRole.deleteMany({
    where: {
      user: {
        tenantId: {
          in: tenantIds
        }
      }
    }
  });

  await withAuditLogDeletion(async () => {
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          {
            tenantId: {
              in: tenantIds
            }
          },
          {
            actorUser: {
              tenantId: {
                in: tenantIds
              }
            }
          }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        tenantId: {
          in: tenantIds
        }
      }
    });

    await prisma.tenant.deleteMany({
      where: {
        id: {
          in: tenantIds
        }
      }
    });
  });

  ownedTenantIds.clear();
}

async function createFixtureData(testName: string) {
  const suffix = createFixtureSuffix(testName);
  const tenantSlug = `auth-portal-handoff-tenant-${suffix}`;
  const userEmail = `auth-portal-handoff-${suffix}@example.com`;
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Portal Handoff Tenant',
      slug: tenantSlug,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });
  ownedTenantIds.add(tenant.id);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: userEmail,
      firstName: 'Portal',
      lastName: 'Handoff'
    }
  });

  const token = createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: tenant.id,
    sessionType: 'end_user'
  });

  return { tenant, token, user };
}

async function createAdminFixtureData(testName: string) {
  const suffix = createFixtureSuffix(testName);
  const tenantSlug = `auth-portal-handoff-tenant-${suffix}`;
  const adminEmail = `auth-portal-handoff-admin-${suffix}@example.com`;
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Portal Handoff Tenant',
      slug: tenantSlug,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });
  ownedTenantIds.add(tenant.id);

  const role = await prisma.role.upsert({
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

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: adminEmail,
      firstName: 'Platform',
      lastName: 'Admin'
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id
    }
  });

  const token = createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId: 'platform',
    sessionType: 'platform_admin'
  });

  return { tenant, token };
}

after(async () => {
  await cleanupOwnedFixtures();
  await prisma.$disconnect();
});

afterEach(async () => {
  await cleanupOwnedFixtures();
});

test('portal auth handoff can be issued and consumed once', async () => {
  const { tenant, token, user } = await createFixtureData('single-use');
  const app = Fastify();
  await authRoutes(app);

  const issueResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs',
    headers: {
      authorization: `Bearer ${token}`,
      'x-tenant-id': tenant.id
    },
    payload: {
      audience: 'portal-web',
      redirectPath: '/dashboard'
    }
  });

  assert.equal(issueResponse.statusCode, 200, issueResponse.body);
  const issued = issueResponse.json() as { artifact: string };
  assert.ok(issued.artifact);

  const consumeResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs/consume',
    payload: {
      artifact: issued.artifact,
      audience: 'portal-web'
    }
  });

  assert.equal(consumeResponse.statusCode, 200, consumeResponse.body);
  const consumed = consumeResponse.json() as {
    accessToken: string;
    redirectPath: string;
    user: { email: string };
  };
  assert.ok(consumed.accessToken);
  assert.equal(consumed.redirectPath, '/dashboard');
  assert.equal(consumed.user.email, user.email);

  const replayResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs/consume',
    payload: {
      artifact: issued.artifact,
      audience: 'portal-web'
    }
  });

  assert.equal(replayResponse.statusCode, 401, replayResponse.body);
  await app.close();
});

test('portal auth handoff rejects tampered, expired, and audience-mismatched artifacts', async () => {
  const { tenant, token } = await createFixtureData('validation');
  const app = Fastify();
  await authRoutes(app);

  const issueResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs',
    headers: {
      authorization: `Bearer ${token}`,
      'x-tenant-id': tenant.id
    },
    payload: {
      audience: 'portal-web',
      redirectPath: '/dashboard'
    }
  });

  assert.equal(issueResponse.statusCode, 200, issueResponse.body);
  const issued = issueResponse.json() as { artifact: string };

  const tamperedArtifact = `${issued.artifact.slice(0, -1)}x`;
  const tamperedResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs/consume',
    payload: {
      artifact: tamperedArtifact,
      audience: 'portal-web'
    }
  });
  assert.equal(tamperedResponse.statusCode, 401, tamperedResponse.body);

  const wrongAudienceResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs/consume',
    payload: {
      artifact: issued.artifact,
      audience: 'admin-console'
    }
  });
  assert.equal(wrongAudienceResponse.statusCode, 401, wrongAudienceResponse.body);

  const storedHandoff = await prisma.portalAuthHandoff.findFirstOrThrow({
    where: {
      tenantId: tenant.id
    }
  });
  await prisma.portalAuthHandoff.update({
    where: {
      id: storedHandoff.id
    },
    data: {
      expiresAt: new Date(Date.now() - 60_000)
    }
  });

  const expiredArtifact = createPortalAuthHandoffArtifact({
    audience: 'portal-web',
    expiresAt: new Date(Date.now() - 1_000),
    handoffId: storedHandoff.id
  });
  const expiredResponse = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs/consume',
    payload: {
      artifact: expiredArtifact,
      audience: 'portal-web'
    }
  });
  assert.equal(expiredResponse.statusCode, 401, expiredResponse.body);

  await app.close();
});

test('portal auth handoff rejects admin session types', async () => {
  const { tenant, token } = await createAdminFixtureData('admin-session');
  const app = Fastify();
  await authRoutes(app);

  const response = await app.inject({
    method: 'POST',
    url: '/auth/portal-handoffs',
    headers: {
      authorization: `Bearer ${token}`,
      'x-tenant-id': tenant.id
    },
    payload: {
      audience: 'portal-web'
    }
  });

  assert.equal(response.statusCode, 403, response.body);
  await app.close();
});
