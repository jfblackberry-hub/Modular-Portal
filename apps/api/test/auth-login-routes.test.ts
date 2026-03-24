import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';

async function cleanupProvisionedAuthFixtures() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
  await prisma.previewSession.deleteMany();
}

beforeEach(async () => {
  await cleanupProvisionedAuthFixtures();
});

after(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');
  await prisma.$disconnect();
});

test('auth login provisions shorthand local users when missing', async () => {
  const app = Fastify();
  await authRoutes(app);

  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'admin',
      password: 'anything'
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const payload = response.json();
  assert.equal(payload.user.email, 'admin');

  const storedUser = await prisma.user.findUnique({
    where: {
      email: 'admin'
    },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  assert.ok(storedUser);
  assert.equal(storedUser.email, 'admin');

  await app.close();
});

test('issued end-user sessions always include non-null tenantId, personaType, and userId', async () => {
  const app = Fastify();
  await authRoutes(app);

  const assertions = [
    {
      label: 'member',
      method: 'POST' as const,
      url: '/auth/login',
      payload: {
        email: 'maria',
        password: 'anything'
      }
    },
    {
      label: 'provider',
      method: 'POST' as const,
      url: '/auth/login/provider',
      payload: {
        email: 'Provider1',
        password: 'anything'
      }
    },
    {
      label: 'employer',
      method: 'POST' as const,
      url: '/auth/login',
      payload: {
        email: 'employer',
        password: 'anything'
      }
    }
  ];

  for (const request of assertions) {
    const response = await app.inject(request);
    assert.equal(response.statusCode, 200, `${request.label}: ${response.body}`);

    const payload = response.json() as {
      user: {
        id: string;
        session: {
          personaType: string;
          type: string;
          tenantId: string | null;
        };
      };
    };

    assert.ok(payload.user.id.trim(), `${request.label}: missing user id`);
    assert.ok(
      payload.user.session.personaType.trim(),
      `${request.label}: missing persona type`
    );
    assert.equal(
      payload.user.session.personaType,
      payload.user.session.type,
      `${request.label}: persona type mismatch`
    );
    assert.equal(
      typeof payload.user.session.tenantId,
      'string',
      `${request.label}: tenantId must be a string`
    );
    assert.ok(
      payload.user.session.tenantId?.trim(),
      `${request.label}: missing tenantId`
    );
  }

  await app.close();
});
