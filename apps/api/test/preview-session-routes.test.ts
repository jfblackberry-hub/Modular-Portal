import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import {
  hashPassword,
  prisma,
  syncTenantTypeDefinitions
} from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';
import { previewSessionRoutes } from '../src/routes/preview-sessions.js';
import {
  createPreviewSession,
  getPreviewSessionStateForCurrentUser
} from '../src/services/preview-session-service.js';

async function ensureMemberPersonaUser(email: string, tenantId: string) {
  const role = await prisma.role.upsert({
    where: {
      code: 'member'
    },
    update: {
      name: 'Member',
      tenantTypeCode: 'PAYER'
    },
    create: {
      code: 'member',
      name: 'Member',
      tenantTypeCode: 'PAYER'
    }
  });

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      tenantId,
      isActive: true,
      status: 'ACTIVE',
      firstName: 'Preview',
      lastName: 'Member'
    },
    create: {
      email,
      firstName: 'Preview',
      lastName: 'Member',
      tenantId,
      isActive: true,
      status: 'ACTIVE'
    }
  });

  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      tenantId
    },
    select: {
      id: true
    }
  });

  if (!existingAssignment) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        tenantId
      }
    });
  }

  await prisma.userTenantMembership.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId
      }
    },
    update: {
      isDefault: true,
      isTenantAdmin: false,
      status: 'ACTIVE',
      activatedAt: new Date()
    },
    create: {
      userId: user.id,
      tenantId,
      isDefault: true,
      isTenantAdmin: false,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });
}

async function ensurePlatformAdminUser(email: string, tenantId: string) {
  await syncTenantTypeDefinitions(prisma);

  const role = await prisma.role.upsert({
    where: {
      code: 'platform_admin'
    },
    update: {
      name: 'Platform Admin',
      description: 'Platform administrator role.',
      isPlatformRole: true,
      appliesToAllTenantTypes: true
    },
    create: {
      code: 'platform_admin',
      name: 'Platform Admin',
      description: 'Platform administrator role.',
      isPlatformRole: true,
      appliesToAllTenantTypes: true
    }
  });

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      tenantId,
      isActive: true,
      status: 'ACTIVE',
      firstName: 'Preview',
      lastName: 'Admin'
    },
    create: {
      email,
      firstName: 'Preview',
      lastName: 'Admin',
      tenantId,
      isActive: true,
      status: 'ACTIVE'
    }
  });

  const existingPlatformAssignment = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      tenantId: null
    },
    select: {
      id: true
    }
  });

  if (!existingPlatformAssignment) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        tenantId: null
      }
    });
  }

  await prisma.userCredential.upsert({
    where: {
      userId: user.id
    },
    update: {
      passwordHash: hashPassword('preview12345'),
      passwordSetAt: new Date(),
      mustResetPassword: false
    },
    create: {
      userId: user.id,
      passwordHash: hashPassword('preview12345'),
      passwordSetAt: new Date(),
      mustResetPassword: false
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
      isTenantAdmin: false,
      status: 'ACTIVE',
      activatedAt: new Date()
    },
    create: {
      userId: user.id,
      tenantId,
      isDefault: true,
      isTenantAdmin: false,
      status: 'ACTIVE',
      activatedAt: new Date()
    }
  });
}

async function ensureHybridMembershipMember(
  email: string,
  primaryTenantId: string,
  secondaryTenantId: string
) {
  const role = await prisma.role.findUnique({
    where: { code: 'member' }
  });
  assert.ok(role);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      tenantId: primaryTenantId,
      isActive: true,
      status: 'ACTIVE',
      firstName: 'Hybrid',
      lastName: 'Member'
    },
    create: {
      email,
      firstName: 'Hybrid',
      lastName: 'Member',
      tenantId: primaryTenantId,
      isActive: true,
      status: 'ACTIVE'
    }
  });

  for (const tenantId of [primaryTenantId, secondaryTenantId]) {
    await prisma.userTenantMembership.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId
        }
      },
      update: {
        isDefault: tenantId === primaryTenantId,
        isTenantAdmin: false,
        status: 'ACTIVE',
        activatedAt: new Date()
      },
      create: {
        userId: user.id,
        tenantId,
        isDefault: tenantId === primaryTenantId,
        isTenantAdmin: false,
        status: 'ACTIVE',
        activatedAt: new Date()
      }
    });

    const existingAssignment = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: role.id,
        tenantId
      },
      select: { id: true }
    });

    if (!existingAssignment) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          tenantId
        }
      });
    }
  }

  return user;
}

async function cleanupTestData() {
  await prisma.previewSession.deleteMany();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
  const cleanupEmails = [
    'preview-platform-admin@example.com',
    'preview-member@example.com',
    'preview-hybrid-member@example.com'
  ];
  await prisma.userCredential.deleteMany({
    where: {
      user: {
        email: {
          in: cleanupEmails
        }
      }
    }
  });
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: cleanupEmails
        }
      }
    }
  });
  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: {
          in: cleanupEmails
        }
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: cleanupEmails
      }
    }
  });
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

  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: 'blue-horizon-health'
    }
  });

  assert.ok(tenant);
  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenant.id);
  await ensureMemberPersonaUser('preview-member@example.com', tenant.id);
  await ensureMemberPersonaUser('preview-member@example.com', tenant.id);

  const adminLogin = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'preview-platform-admin@example.com',
      password: 'preview12345'
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

  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: 'blue-horizon-health'
    }
  });

  assert.ok(tenant);
  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenant.id);
  await ensureMemberPersonaUser('preview-member@example.com', tenant.id);

  const adminLogin = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'preview-platform-admin@example.com',
      password: 'preview12345'
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

test('preview session create ignores users whose primary tenant differs from preview tenant', async () => {
  const app = Fastify();
  await authRoutes(app);
  await previewSessionRoutes(app);

  const tenantA = await prisma.tenant.findUnique({
    where: { slug: 'blue-horizon-health' }
  });
  const tenantB = await prisma.tenant.findFirst({
    where: {
      isActive: true,
      id: { not: tenantA?.id ?? '' }
    }
  });

  assert.ok(tenantA);
  assert.ok(
    tenantB,
    'Seeded database needs a second active tenant for cross-tenant preview tests.'
  );

  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenantA.id);
  await ensureHybridMembershipMember(
    'preview-hybrid-member@example.com',
    tenantA.id,
    tenantB.id
  );

  const adminLogin = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'preview-platform-admin@example.com',
      password: 'preview12345'
    }
  });

  assert.equal(adminLogin.statusCode, 200, adminLogin.body);
  const adminPayload = adminLogin.json() as { token: string };

  const createForSecondaryTenant = await app.inject({
    method: 'POST',
    url: '/platform-admin/preview-sessions',
    headers: {
      authorization: `Bearer ${adminPayload.token}`,
      'x-tenant-id': 'platform'
    },
    payload: {
      tenantId: tenantB.id,
      portalType: 'member',
      persona: 'member',
      mode: 'READ_ONLY'
    }
  });

  assert.equal(createForSecondaryTenant.statusCode, 400, createForSecondaryTenant.body);
  assert.match(
    createForSecondaryTenant.body,
    /No active user is available for that tenant persona/i
  );

  await app.close();
});

test('preview session state lookup is tenant-scoped and rejects expired sessions', async () => {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'blue-horizon-health' }
  });
  assert.ok(tenant);

  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenant.id);
  await ensureMemberPersonaUser('preview-member@example.com', tenant.id);

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: 'preview-platform-admin@example.com' }
  });
  const member = await prisma.user.findUniqueOrThrow({
    where: { email: 'preview-member@example.com' }
  });

  const sessionRecord = await createPreviewSession(
    {
      tenantId: tenant.id,
      portalType: 'member',
      persona: 'member',
      mode: 'READ_ONLY'
    },
    { actorUserId: admin.id }
  );

  const wrongTenantId = '22222222-2222-2222-2222-222222222222';
  await assert.rejects(
    () =>
      getPreviewSessionStateForCurrentUser({
        previewSessionId: sessionRecord.sessionId,
        userId: member.id,
        tenantId: wrongTenantId
      }),
    /Preview session not found/i
  );

  await getPreviewSessionStateForCurrentUser({
    previewSessionId: sessionRecord.sessionId,
    userId: member.id,
    tenantId: tenant.id
  });

  await prisma.previewSession.update({
    where: { id: sessionRecord.sessionId },
    data: { expiresAt: new Date(Date.now() - 60_000) }
  });

  await assert.rejects(
    () =>
      getPreviewSessionStateForCurrentUser({
        previewSessionId: sessionRecord.sessionId,
        userId: member.id,
        tenantId: tenant.id
      }),
    /Preview session not found/i
  );
});

test('database rejects PreviewSession rows when target user primary tenant mismatches session tenant', async () => {
  const tenantA = await prisma.tenant.findUnique({
    where: { slug: 'blue-horizon-health' }
  });
  const tenantB = await prisma.tenant.findFirst({
    where: {
      isActive: true,
      id: { not: tenantA?.id ?? '' }
    }
  });

  assert.ok(tenantA);
  assert.ok(tenantB);

  await ensurePlatformAdminUser('preview-platform-admin@example.com', tenantA.id);
  await ensureMemberPersonaUser('preview-member@example.com', tenantA.id);

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: 'preview-platform-admin@example.com' }
  });
  const member = await prisma.user.findUniqueOrThrow({
    where: { email: 'preview-member@example.com' }
  });

  await assert.rejects(
    async () => {
      await prisma.previewSession.create({
        data: {
          adminUserId: admin.id,
          tenantId: tenantB.id,
          targetUserId: member.id,
          portalType: 'member',
          persona: 'member',
          mode: 'READ_ONLY',
          launchToken: randomUUID(),
          expiresAt: new Date(Date.now() + 3_600_000)
        }
      });
    },
    (error: unknown) =>
      error instanceof Error &&
      /PreviewSession targetUser primary tenant must match tenantId/i.test(error.message)
  );
});

test('preview-sessions current state endpoint fails closed without authentication', async () => {
  const app = Fastify();
  await authRoutes(app);
  await previewSessionRoutes(app);

  const response = await app.inject({
    method: 'GET',
    url: '/preview-sessions/current/state'
  });

  assert.equal(response.statusCode, 401, response.body);

  await app.close();
});
