import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import { clearSubscriptions } from '../src/events/eventBus.js';
import { publish } from '../src/events/eventBus.js';
import { runNextJob } from '../src/jobs/jobWorker.js';
import { getJobById } from '../src/jobs/jobQueue.js';
import { JOB_STATUS } from '../src/jobs/jobTypes.js';
import {
  clearIntegrationAdapters,
  registerDefaultIntegrations
} from '../src/integrations/registry.js';
import {
  clearIntegrationEventSubscriptions,
  registerIntegrationEventSubscriptions
} from '../src/integrations/subscriptions.js';

const TEST_CONNECTOR_NAMES = [
  'Webhook Subscriber',
  'Webhook Retry Subscriber'
];

beforeEach(async () => {
  clearIntegrationAdapters();
  clearIntegrationEventSubscriptions();
  clearSubscriptions();
  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });
  await prisma.integrationExecution.deleteMany({
    where: {
      connectorConfig: {
        adapterKey: 'webhook'
      }
    }
  });
  await prisma.connectorConfig.deleteMany({
    where: {
      adapterKey: 'webhook'
    }
  });
});

after(async () => {
  clearIntegrationAdapters();
  clearIntegrationEventSubscriptions();
  clearSubscriptions();
  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });
  await prisma.integrationExecution.deleteMany({
    where: {
      connectorConfig: {
        adapterKey: 'webhook'
      }
    }
  });
  await prisma.connectorConfig.deleteMany({
    where: {
      adapterKey: 'webhook'
    }
  });
  await prisma.$disconnect();
});

test('webhook subscriptions enqueue and deliver configured event payloads', async () => {
  registerDefaultIntegrations();
  registerIntegrationEventSubscriptions();

  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

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

    await runNextJob();

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

  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

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

    await runNextJob();

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

    await runNextJob();

    const secondAttempt = await getJobById(queuedJob.id);
    assert.equal(secondAttempt?.status, JOB_STATUS.SUCCEEDED);
    assert.equal(requestCount, 2);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
