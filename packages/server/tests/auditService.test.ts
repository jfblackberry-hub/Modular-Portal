import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import {
  logAuthenticationEvent,
  registerAuditLogSink,
  resetAuditLogSinksForTest
} from '../src/services/auditService.js';
import { createStructuredLogger } from '../src/observability/logger.js';

const TEST_TENANT_SLUG = 'audit-service-test-tenant';
const TEST_USER_EMAIL = 'audit-service-user@example.com';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.user.deleteMany({
    where: {
      email: TEST_USER_EMAIL
    }
  });

  await prisma.tenant.deleteMany({
    where: {
      slug: TEST_TENANT_SLUG
    }
  });
}

beforeEach(async () => {
  resetAuditLogSinksForTest();
  await cleanupTestData();
});

after(async () => {
  resetAuditLogSinksForTest();
  await cleanupTestData();
  await prisma.$disconnect();
});

test('audit logs fan out through registered sinks and persist request metadata', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Audit Service Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: TEST_USER_EMAIL,
      firstName: 'Audit',
      lastName: 'Service'
    }
  });

  const sinkWrites: string[] = [];

  registerAuditLogSink({
    async write(input) {
      sinkWrites.push(`${input.action}:${input.entityType}:${input.entityId ?? 'none'}`);
    }
  });

  const auditLog = await logAuthenticationEvent({
    tenantId: tenant.id,
    actorUserId: user.id,
    action: 'auth.login.success',
    resourceType: 'user',
    resourceId: user.id,
    request: {
      correlationId: 'audit-correlation-id',
      method: 'POST',
      route: '/auth/login',
      statusCode: 200
    },
    metadata: {
      sessionType: 'end_user'
    },
    ipAddress: '127.0.0.1',
    userAgent: 'audit-service-test'
  });

  assert.equal(sinkWrites.length, 1);
  assert.equal(sinkWrites[0], `auth.login.success:user:${user.id}`);
  assert.equal(auditLog.tenantId, tenant.id);
  assert.equal(auditLog.actorUserId, user.id);
  assert.deepEqual(auditLog.metadata, {
    observability: {
      capabilityId: 'platform.identity',
      correlationId: 'audit-correlation-id',
      failureType: 'none',
      tenantId: tenant.id
    },
    sessionType: 'end_user',
    request: {
      correlationId: 'audit-correlation-id',
      method: 'POST',
      route: '/auth/login',
      statusCode: 200
    }
  });
});

test('audit logs reject update and delete mutations', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Audit Service Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const auditLog = await logAuthenticationEvent({
    tenantId: tenant.id,
    action: 'auth.login.success',
    resourceType: 'user',
    resourceId: 'audit-user'
  });

  await assert.rejects(
    prisma.$executeRawUnsafe(
      `UPDATE audit_logs SET action = 'auth.login.changed' WHERE id = '${auditLog.id}'::uuid`
    ),
    /append-only/
  );

  await assert.rejects(
    prisma.$executeRawUnsafe(
      `DELETE FROM audit_logs WHERE id = '${auditLog.id}'::uuid`
    ),
    /append-only/
  );
});

test('audit logs redact sensitive metadata and state values', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Audit Service Tenant',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const auditLog = await logAuthenticationEvent({
    tenantId: tenant.id,
    action: 'auth.login.success',
    resourceType: 'user',
    resourceId: 'audit-user',
    beforeState: {
      email: 'member@example.com',
      memberNumber: 'M12345'
    },
    metadata: {
      authorization: 'Bearer super-secret-token',
      nested: {
        ssn: '111-22-3333'
      },
      request: {
        route: '/auth/login'
      }
    }
  });

  assert.deepEqual(auditLog.beforeState, {
    email: '[REDACTED]',
    memberNumber: '[REDACTED]'
  });
  assert.deepEqual(auditLog.metadata, {
    observability: {
      capabilityId: 'platform.identity',
      correlationId: auditLog.metadata?.observability?.correlationId,
      failureType: 'none',
      tenantId: tenant.id
    },
    authorization: '[REDACTED]',
    nested: {
      ssn: '[REDACTED]'
    },
    request: {
      route: '/auth/login'
    }
  });
});

test('structured logger rejects missing observability fields', () => {
  assert.throws(
    () =>
      createStructuredLogger({
        observability: {
          capabilityId: '',
          failureType: 'none',
          tenantId: 'tenant-1'
        },
        serviceName: 'server-test'
      }),
    /capabilityId is required/
  );
});
