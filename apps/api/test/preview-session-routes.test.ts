import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';
import { previewSessionRoutes } from '../src/routes/preview-sessions.js';

async function ensurePlatformAdminUser(email: string, tenantId: string) {
  const role = await prisma.role.upsert({
    where: {
      code: 'platform_admin'
    },
    update: {
      name: 'Platform Admin',
      description: 'Platform administrator role.'
    },
    create: {
      code: 'platform_admin',
      name: 'Platform Admin',
      description: 'Platform administrator role.'
    }
  });

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      tenantId,
      isActive: true,
      firstName: 'Preview',
      lastName: 'Admin'
    },
    create: {
      email,
      firstName: 'Preview',
      lastName: 'Admin',
      tenantId,
      isActive: true
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  await prisma.userTenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId
      }
    },
    update: {
      isDefault: true,
      isTenantAdmin: false
    },
    create: {
      userId: user.id,
      tenantId,
      isDefault: true,
      isTenantAdmin: false
    }
  });
}

async function cleanupTestData() {
  await prisma.previewSession.deleteMany();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
}

beforeEach(async () => {
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('persona session audit events succeed for authorized tenant scope and reject unavailable tenant scope', async () => {
  const app = Fastify();
  await authRoutes(app);
  await previewSessionRoutes(app);

  await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'maria',
      password: 'anything'
    }
  });

  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: 'blue-horizon-health'
    }
  });

  assert.ok(tenant);
  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenant.id);

  const adminLogin = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'preview-platform-admin@example.com',
      password: 'anything'
    }
  });

  assert.equal(adminLogin.statusCode, 200, adminLogin.body);
  const adminPayload = adminLogin.json() as {
    token: string;
  };

  const authorizedResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/persona-sessions/events',
    headers: {
      authorization: `Bearer ${adminPayload.token}`,
      'x-tenant-id': 'platform'
    },
    payload: {
      action: 'persona.session.opened',
      sessionId: 'persona-session-1',
      tenantId: tenant.id,
      personaType: 'member',
      userId: 'target-user-1'
    }
  });

  assert.equal(authorizedResponse.statusCode, 202, authorizedResponse.body);

  const unauthorizedResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/persona-sessions/events',
    headers: {
      authorization: `Bearer ${adminPayload.token}`,
      'x-tenant-id': 'platform'
    },
    payload: {
      action: 'persona.session.focused',
      sessionId: 'persona-session-2',
      tenantId: '11111111-1111-1111-1111-111111111111',
      personaType: 'member',
      userId: 'target-user-1'
    }
  });

  assert.equal(unauthorizedResponse.statusCode, 403, unauthorizedResponse.body);
  assert.match(
    unauthorizedResponse.body,
    /Target tenant scope is unavailable/i
  );

  await app.close();
});

test('preview session launch urls use opaque artifact paths instead of query-string tokens', async () => {
  const app = Fastify();
  await authRoutes(app);
  await previewSessionRoutes(app);

  await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'maria',
      password: 'anything'
    }
  });

  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: 'blue-horizon-health'
    }
  });

  assert.ok(tenant);
  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenant.id);

  const adminLogin = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'preview-platform-admin@example.com',
      password: 'anything'
    }
  });

  assert.equal(adminLogin.statusCode, 200, adminLogin.body);
  const adminPayload = adminLogin.json() as {
    token: string;
  };

  const createResponse = await app.inject({
    method: 'POST',
    url: '/platform-admin/preview-sessions',
    headers: {
      authorization: `Bearer ${adminPayload.token}`,
      'x-tenant-id': 'platform'
    },
    payload: {
      tenantId: tenant.id,
      portalType: 'member',
      persona: 'member',
      mode: 'READ_ONLY'
    }
  });

  assert.equal(createResponse.statusCode, 201, createResponse.body);
  const payload = createResponse.json() as {
    launchUrl: string;
  };

  const parsed = new URL(`http://localhost${payload.launchUrl}`);
  assert.equal(parsed.pathname.startsWith('/api/admin-preview/start/'), true);
  assert.equal(parsed.search, '');

  await app.close();
});
