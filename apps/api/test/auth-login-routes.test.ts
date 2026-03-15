import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import Fastify from 'fastify';

import { authRoutes } from '../src/routes/auth.js';

async function cleanupTestData() {
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          in: ['user', 'tenant', 'admin']
        }
      }
    }
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['user', 'tenant', 'admin']
      }
    }
  });

  await prisma.tenantBranding.deleteMany({
    where: {
      tenant: {
        slug: 'blue-horizon-health'
      }
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: 'blue-horizon-health'
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
  assert.equal(payload.user.roles.includes('platform_admin'), true);

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
  assert.equal(storedUser.roles.some(({ role }) => role.code === 'platform_admin'), true);

  await app.close();
});
