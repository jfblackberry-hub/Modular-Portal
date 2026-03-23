import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import { clearSubscriptions, publish } from '../src/events/eventBus.js';
import { INTEGRATION_TRIGGER_MODE } from '../src/integrations/integration.js';
import { clearIntegrationAdapters, listIntegrationAdapters, registerDefaultIntegrations } from '../src/integrations/registry.js';
import { executeIntegration, listIntegrationExecutions } from '../src/integrations/service.js';
import {
  enqueueScheduledIntegrations,
  registerIntegrationEventSubscriptions
} from '../src/integrations/subscriptions.js';
import { listJobs } from '../src/jobs/jobQueue.js';

const TEST_CONNECTOR_NAMES = [
  'Integration Framework Local',
  'Integration Framework Scheduled',
  'Integration Framework Event'
];

let tempDirectory = '';

beforeEach(async () => {
  clearIntegrationAdapters();
  clearSubscriptions();
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'integration-framework-'));
  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });
  await prisma.integrationExecution.deleteMany({
    where: {
      OR: [
        {
          connectorConfig: {
            name: {
              in: TEST_CONNECTOR_NAMES
            }
          }
        },
        {
          connectorConfig: {
            adapterKey: 'webhook'
          }
        }
      ]
    }
  });
  await prisma.connectorConfig.deleteMany({
    where: {
      OR: [
        {
          name: {
            in: TEST_CONNECTOR_NAMES
          }
        },
        {
          adapterKey: 'webhook'
        }
      ]
    }
  });
});

after(async () => {
  clearIntegrationAdapters();
  clearSubscriptions();
  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });
  await prisma.integrationExecution.deleteMany({
    where: {
      OR: [
        {
          connectorConfig: {
            name: {
              in: TEST_CONNECTOR_NAMES
            }
          }
        },
        {
          connectorConfig: {
            adapterKey: 'webhook'
          }
        }
      ]
    }
  });
  await prisma.connectorConfig.deleteMany({
    where: {
      OR: [
        {
          name: {
            in: TEST_CONNECTOR_NAMES
          }
        },
        {
          adapterKey: 'webhook'
        }
      ]
    }
  });

  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
  }

  await prisma.$disconnect();
});

test('default integration adapters expose pluggable transports and capabilities', () => {
  registerDefaultIntegrations();

  const adapters = listIntegrationAdapters();

  assert.deepEqual(
    adapters.map((adapter) => adapter.key),
    ['local-file', 'rest-api', 'webhook']
  );
  assert.equal(adapters.find((adapter) => adapter.key === 'rest-api')?.capabilities?.rest, true);
  assert.equal(
    adapters.find((adapter) => adapter.key === 'local-file')?.capabilities?.fileBased,
    true
  );
  assert.equal(
    adapters.find((adapter) => adapter.key === 'webhook')?.capabilities?.eventTrigger,
    true
  );
});

test('integration execution is logged for tenant-configured adapters', async () => {
  registerDefaultIntegrations();

  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  const fixturesDirectory = path.join(tempDirectory, 'records');
  await mkdir(fixturesDirectory, { recursive: true });
  await writeFile(
    path.join(fixturesDirectory, 'claims.json'),
    JSON.stringify([{ claimId: 'CL-1', amount: 42.5 }], null, 2),
    'utf8'
  );

  const connector = await prisma.connectorConfig.create({
    data: {
      tenantId: tenant.id,
      adapterKey: 'local-file',
      name: 'Integration Framework Local',
      status: 'ACTIVE',
      config: {
        directoryPath: fixturesDirectory
      }
    }
  });

  await executeIntegration(connector.id, {
    triggerMode: INTEGRATION_TRIGGER_MODE.MANUAL
  });

  const executions = await listIntegrationExecutions({
    connectorId: connector.id
  });

  assert.equal(executions.length, 1);
  assert.equal(executions[0]?.status, 'SUCCEEDED');
  assert.equal(executions[0]?.adapterKey, 'local-file');
  assert.equal(executions[0]?.recordsProcessed, 1);
});

test('scheduled integrations enqueue sync jobs for active tenant configs', async () => {
  registerDefaultIntegrations();

  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  await prisma.connectorConfig.create({
    data: {
      tenantId: tenant.id,
      adapterKey: 'webhook',
      name: 'Integration Framework Scheduled',
      status: 'ACTIVE',
      config: {
        trigger: {
          mode: 'SCHEDULED',
          schedule: '0 * * * *'
        },
        url: 'https://example.invalid/hook'
      }
    }
  });

  const scheduledCount = await enqueueScheduledIntegrations();
  const jobs = await listJobs({
    type: 'connector.sync',
    tenantId: tenant.id
  });

  assert.equal(scheduledCount, 1);
  assert.equal(jobs.length, 1);
  assert.equal((jobs[0]?.payload as { triggerMode?: string }).triggerMode, 'SCHEDULED');
});

test('event-triggered integrations enqueue sync jobs when matching events publish', async () => {
  registerDefaultIntegrations();
  registerIntegrationEventSubscriptions();

  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  const connector = await prisma.connectorConfig.create({
    data: {
      tenantId: tenant.id,
      adapterKey: 'webhook',
      name: 'Integration Framework Event',
      status: 'ACTIVE',
      config: {
        trigger: {
          mode: 'EVENT',
          eventName: 'document.uploaded'
        },
        url: 'https://example.invalid/hook'
      }
    }
  });

  await publish('document.uploaded', {
    id: 'integration-document-uploaded',
    correlationId: 'integration-document-uploaded',
    timestamp: new Date(),
    tenantId: tenant.id,
    type: 'document.uploaded',
    payload: {
      documentId: 'doc-1',
      fileName: 'doc.pdf',
      contentType: 'application/pdf',
      uploadedByUserId: null
    }
  });

  const jobs = await listJobs({
    type: 'connector.sync',
    tenantId: tenant.id
  });

  assert.equal(jobs.some((job) => {
    const payload = job.payload as {
      connectorId?: string;
      triggerEvent?: string;
      triggerMode?: string;
    };

    return (
      payload.connectorId === connector.id &&
      payload.triggerEvent === 'document.uploaded' &&
      payload.triggerMode === 'EVENT'
    );
  }), true);
});
