import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';
import { deriveBillingEnrollmentHouseholdId } from '@payer-portal/server';
import { billingEnrollmentRoutes } from '../src/routes/billing-enrollment.js';
import { createAccessToken } from '../src/services/access-token-service.js';
import Fastify from 'fastify';

const TENANT_SLUG = 'billing-household-scope-tenant';
const MEMBER_EMAIL = 'billing-household-member@example.com';
const OTHER_MEMBER_EMAIL = 'billing-household-other@example.com';

async function cleanup() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.userTenantMembership.deleteMany({
    where: {
      user: {
        email: { in: [MEMBER_EMAIL, OTHER_MEMBER_EMAIL] }
      }
    }
  });
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: { in: [MEMBER_EMAIL, OTHER_MEMBER_EMAIL] }
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: [MEMBER_EMAIL, OTHER_MEMBER_EMAIL] }
    }
  });
  await prisma.tenant.deleteMany({
    where: { slug: { in: [TENANT_SLUG, `${TENANT_SLUG}-other`] } }
  });
}

beforeEach(async () => {
  await cleanup();
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function seedMemberUser() {
  const role = await prisma.role.upsert({
    where: { code: 'member' },
    update: { name: 'Member', tenantTypeCode: 'PAYER' },
    create: {
      code: 'member',
      name: 'Member',
      tenantTypeCode: 'PAYER'
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Billing Household Scope Tenant',
      slug: TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: MEMBER_EMAIL,
      firstName: 'Household',
      lastName: 'Member'
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
      isTenantAdmin: false
    }
  });

  return { tenant, user };
}

async function seedSecondMemberInSameTenant(tenantId: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: 'member' } });
  const user = await prisma.user.create({
    data: {
      tenantId,
      email: OTHER_MEMBER_EMAIL,
      firstName: 'Other',
      lastName: 'Member'
    }
  });
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
      tenantId
    }
  });
  await prisma.userTenantMembership.create({
    data: {
      userId: user.id,
      tenantId,
      isDefault: true,
      isTenantAdmin: false
    }
  });
  return user;
}

function memberToken(user: { id: string; email: string }, tenantId: string) {
  return createAccessToken({
    userId: user.id,
    email: user.email,
    tenantId,
    sessionType: 'end_user'
  });
}

test('billing enrollment dependents requires householdId query parameter', async () => {
  const { tenant, user } = await seedMemberUser();
  const app = Fastify();
  await billingEnrollmentRoutes(app);
  const token = memberToken(user, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/billing-enrollment/dependents',
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 400, response.body);
  assert.match(response.body, /householdId query parameter is required/i);

  await app.close();
});

test('billing enrollment dependents succeeds with authorized household id', async () => {
  const { tenant, user } = await seedMemberUser();
  const householdId = deriveBillingEnrollmentHouseholdId(tenant.id, user.id);
  const app = Fastify();
  await billingEnrollmentRoutes(app);
  const token = memberToken(user, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: `/api/v1/billing-enrollment/dependents?householdId=${encodeURIComponent(householdId)}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 200, response.body);
  const body = response.json() as { householdId: string };
  assert.equal(body.householdId, householdId);

  await app.close();
});

test('billing enrollment dependents rejects household id derived for a different tenant', async () => {
  const { tenant, user } = await seedMemberUser();
  const otherTenant = await prisma.tenant.create({
    data: {
      name: 'Other Billing Tenant',
      slug: `${TENANT_SLUG}-other`,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });
  const wrongTenantHouseholdId = deriveBillingEnrollmentHouseholdId(otherTenant.id, user.id);
  const app = Fastify();
  await billingEnrollmentRoutes(app);
  const token = memberToken(user, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: `/api/v1/billing-enrollment/dependents?householdId=${encodeURIComponent(wrongTenantHouseholdId)}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 403, response.body);

  await app.close();
});

test('billing enrollment dependents rejects household id for another user in same tenant', async () => {
  const { tenant, user } = await seedMemberUser();
  const other = await seedSecondMemberInSameTenant(tenant.id);
  const otherHouseholdId = deriveBillingEnrollmentHouseholdId(tenant.id, other.id);
  const app = Fastify();
  await billingEnrollmentRoutes(app);
  const token = memberToken(user, tenant.id);

  const response = await app.inject({
    method: 'GET',
    url: `/api/v1/billing-enrollment/dependents?householdId=${encodeURIComponent(otherHouseholdId)}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 403, response.body);
  assert.match(response.body, /not available for the current session/i);

  await app.close();
});
