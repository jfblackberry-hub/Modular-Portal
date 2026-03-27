import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import { publish, waitForBackgroundPublishes } from '../src/events/eventBus.js';
import {
  clearIntegrationAdapters,
  registerDefaultIntegrations
} from '../src/integrations/registry.js';
import {
  clearIntegrationEventSubscriptions,
  registerIntegrationEventSubscriptions
} from '../src/integrations/subscriptions.js';
import { getJobById } from '../src/jobs/jobQueue.js';
import { JOB_STATUS } from '../src/jobs/jobTypes.js';
import { runNextJob } from '../src/jobs/jobWorker.js';

const WEBHOOK_TEST_TENANT_SLUG_PREFIX = 'server-webhook-test';

async function withAuditLogDeletion<T>(callback: () => Promise<T>) {
  await prisma.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER USER');

  try {
    return await callback();
  } finally {
    await prisma.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER USER');
  }
}

async function cleanupOwnedTenants() {
  const tenants = await prisma.tenant.findMany({
    where: {
      slug: {
        startsWith: WEBHOOK_TEST_TENANT_SLUG_PREFIX
      }
    },
    select: {
      id: true
    }
  });

  const tenantIds = tenants.map((tenant) => tenant.id);

  if (tenantIds.length === 0) {
    return;
  }

  const eventIds = (
    await prisma.eventRecord.findMany({
      where: {
        tenantId: {
          in: tenantIds
        }
      },
      select: {
        id: true
      }
    })
  ).map((event) => event.id);

  await withAuditLogDeletion(async () => {
    await prisma.$transaction([
      prisma.integrationExecution.deleteMany({ where: { tenantId: { in: tenantIds } } }),
      prisma.connectorConfig.deleteMany({ where: { tenantId: { in: tenantIds } } }),
      prisma.job.deleteMany({ where: { tenantId: { in: tenantIds } } }),
      prisma.auditLog.deleteMany({ where: { tenantId: { in: tenantIds } } }),
      ...(eventIds.length > 0
        ? [prisma.eventDelivery.deleteMany({ where: { eventId: { in: eventIds } } })]
        : []),
      prisma.eventRecord.deleteMany({ where: { tenantId: { in: tenantIds } } }),
      prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    ]);
  });
}

async function createOwnedTenant(testName: string) {
  const slug = `${WEBHOOK_TEST_TENANT_SLUG_PREFIX}-${testName}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`.toLowerCase();

  return prisma.tenant.create({
    data: {
      name: `Webhook ${testName}`,
      slug,
      status: 'ACTIVE',
      brandingConfig: {}
    },
    select: {
      id: true
    }
  });
}

beforeEach(async () => {
  clearIntegrationAdapters();
  clearIntegrationEventSubscriptions();
  await waitForBackgroundPublishes();
  await cleanupOwnedTenants();
});

after(async () => {
  await waitForBackgroundPublishes();
  clearIntegrationAdapters();
  clearIntegrationEventSubscriptions();
  await waitForBackgroundPublishes();
  await cleanupOwnedTenants();
  await prisma.$disconnect();
});

test('webhook subscriptions enqueue and deliver configured event payloads', async () => {
  registerDefaultIntegrations();
  registerIntegrationEventSubscriptions();

  const tenant = await createOwnedTenant('delivery-success');

  let receivedBody: Record<string, unknown> | null = null;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];

    request.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    request.on('end', () => {
      receivedBody = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<
        string,
        unknown
      >;
      response.writeHead(200, {
        'Content-Type': 'application/json'
      });
      response.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to start webhook test server');
  }

  try {
    const connector = await prisma.connectorConfig.create({
      data: {
        tenantId: tenant.id,
        adapterKey: 'webhook',
        name: 'Webhook Subscriber',
        status: 'ACTIVE',
        config: {
          endpoint_url: `http://127.0.0.1:${address.port}/tenant-created`,
          event_types: ['tenant.created'],
          retry_policy: {
            max_attempts: 2
          },
          timeout: 5_000,
          authentication: {
            type: 'bearer',
            token: 'secret-token'
          },
          trigger: {
            mode: 'EVENT'
          }
        }
      }
    });

    await publish('tenant.created', {
      id: 'tenant-webhook-event',
      correlationId: 'tenant-webhook-correlation',
      timestamp: new Date('2026-03-14T10:00:00.000Z'),
      tenantId: tenant.id,
      type: 'tenant.created',
      payload: {
        tenantId: tenant.id,
        name: 'Webhook Tenant',
        slug: 'webhook-tenant',
        status: 'ACTIVE'
      }
    });

    const queuedJobs = await prisma.job.findMany({
      where: {
        type: 'connector.sync',
        tenantId: tenant.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    const queuedJob = queuedJobs.find(
      (job) =>
        (job.payload as { connectorId?: string }).connectorId === connector.id
    );

    assert.ok(queuedJob);

    assert.equal(queuedJob.maxAttempts, 2);

    await runNextJob({ tenantId: tenant.id });

    assert.deepEqual(receivedBody, {
      correlation_id: 'tenant-webhook-correlation',
      data: {
        tenantId: tenant.id,
        name: 'Webhook Tenant',
        slug: 'webhook-tenant',
        status: 'ACTIVE'
      },
      event: 'tenant.created',
      event_id: 'tenant-webhook-event',
      tenant_id: tenant.id,
      timestamp: '2026-03-14T10:00:00.000Z'
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('failed webhook deliveries retry through the job queue', async () => {
  registerDefaultIntegrations();
  registerIntegrationEventSubscriptions();

  const tenant = await createOwnedTenant('delivery-retry');

  let requestCount = 0;
  const server = createServer((_request, response) => {
    requestCount += 1;

    if (requestCount === 1) {
      response.writeHead(500, {
        'Content-Type': 'application/json'
      });
      response.end(JSON.stringify({ message: 'retry me' }));
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/json'
    });
    response.end(JSON.stringify({ ok: true }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to start webhook retry server');
  }

  try {
    const connector = await prisma.connectorConfig.create({
      data: {
        tenantId: tenant.id,
        adapterKey: 'webhook',
        name: 'Webhook Retry Subscriber',
        status: 'ACTIVE',
        config: {
          endpoint_url: `http://127.0.0.1:${address.port}/retry`,
          event_types: ['document.uploaded'],
          retry_policy: {
            max_attempts: 2
          },
          timeout: 5_000,
          trigger: {
            mode: 'EVENT'
          }
        }
      }
    });

    await publish('document.uploaded', {
      id: 'document-webhook-event',
      correlationId: 'document-webhook-correlation',
      timestamp: new Date(),
      tenantId: tenant.id,
      type: 'document.uploaded',
      payload: {
        documentId: 'doc-1',
        fileName: 'member.pdf',
        contentType: 'application/pdf',
        uploadedByUserId: null
      }
    });

    const queuedJobs = await prisma.job.findMany({
      where: {
        type: 'connector.sync',
        tenantId: tenant.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    const queuedJob = queuedJobs.find(
      (job) =>
        (job.payload as { connectorId?: string }).connectorId === connector.id
    );

    assert.ok(queuedJob);
    await prisma.job.updateMany({
      where: {
        type: 'connector.sync',
        tenantId: tenant.id,
        NOT: {
          id: queuedJob.id
        }
      },
      data: {
        runAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    assert.equal(
      (queuedJob.payload as { connectorId?: string }).connectorId,
      connector.id
    );
    assert.ok(
      await prisma.connectorConfig.findUnique({
        where: {
          id: connector.id
        }
      })
    );

    await runNextJob({ tenantId: tenant.id });

    const firstAttempt = await getJobById(queuedJob.id);
    assert.equal(firstAttempt?.status, JOB_STATUS.PENDING);

    await prisma.job.update({
      where: {
        id: queuedJob.id
      },
      data: {
        runAt: new Date(Date.now() - 1_000)
      }
    });

    await runNextJob({ tenantId: tenant.id });

    const secondAttempt = await getJobById(queuedJob.id);
    assert.equal(secondAttempt?.status, JOB_STATUS.SUCCEEDED);
    assert.equal(requestCount, 2);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
