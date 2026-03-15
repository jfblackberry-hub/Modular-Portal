import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import { clear } from '../src/adapters/adapterRegistry.js';
import { subscribe } from '../src/events/eventBus.js';
import { enqueueJob, getJobById } from '../src/jobs/jobQueue.js';
import { JOB_STATUS } from '../src/jobs/jobTypes.js';
import { runNextJob } from '../src/jobs/jobWorker.js';

let tempDirectory = '';

beforeEach(async () => {
  clear();
  tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'connector-sync-'));
  await prisma.job.updateMany({
    where: {
      status: 'PENDING',
      NOT: {
        type: 'connector.sync'
      }
    },
    data: {
      runAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });
  await prisma.connectorConfig.deleteMany({
    where: {
      name: 'Test Local Connector'
    }
  });
});

after(async () => {
  clear();
  await prisma.job.deleteMany({
    where: {
      type: 'connector.sync'
    }
  });
  await prisma.connectorConfig.deleteMany({
    where: {
      name: {
        in: ['Test Local Connector', 'Test REST Connector', 'Test REST Retry Connector']
      }
    }
  });

  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
  }

  await prisma.$disconnect();
});

test('local file connector runs via job queue, logs parsed records, and updates sync timestamp', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  const fixturesDirectory = path.join(tempDirectory, 'records');
  await mkdir(fixturesDirectory, { recursive: true });
  await writeFile(
    path.join(fixturesDirectory, 'members.csv'),
    ['memberId,firstName,lastName', '2001,Avery,Stone', '2002,Riley,Park'].join('\n'),
    'utf8'
  );
  await writeFile(
    path.join(fixturesDirectory, 'claims.json'),
    JSON.stringify([{ claimId: 'CL-1', amount: 42.5 }], null, 2),
    'utf8'
  );

  const connector = await prisma.connectorConfig.create({
    data: {
      tenantId: tenant.id,
      adapterKey: 'local-file',
      name: 'Test Local Connector',
      status: 'ACTIVE',
      config: {
        directoryPath: fixturesDirectory
      }
    }
  });

  const importedEvents: Array<{
    fileName: string;
    record: Record<string, unknown>;
  }> = [];
  const unsubscribe = subscribe('connector.record.imported', async (event) => {
    importedEvents.push({
      fileName: event.payload.fileName,
      record: event.payload.record
    });
  });

  const parsedLogs: unknown[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    if (args[0] === '[connector] parsed record') {
      parsedLogs.push(args[1]);
    }
    originalLog(...args);
  };

  try {
    const job = await enqueueJob({
      type: 'connector.sync',
      tenantId: tenant.id,
      payload: {
        connectorId: connector.id,
        connectorType: 'local-file'
      }
    });

    await runNextJob();

    const storedJob = await getJobById(job.id);
    const updatedConnector = await prisma.connectorConfig.findUniqueOrThrow({
      where: {
        id: connector.id
      }
    });

    assert.equal(storedJob?.status, JOB_STATUS.SUCCEEDED);
    assert.ok(updatedConnector.lastSyncAt);
    assert.equal(parsedLogs.length, 3);
    assert.equal(importedEvents.length, 3);
    assert.equal(importedEvents.some((event) => event.fileName === 'members.csv'), true);
    assert.equal(importedEvents.some((event) => event.fileName === 'claims.json'), true);
  } finally {
    console.log = originalLog;
    unsubscribe();
  }
});

test('rest adapter fetches records and publishes events via connector.sync job', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  const server = createServer((request, response) => {
    if (
      request.url === '/records' &&
      request.headers.authorization === 'Bearer test-token'
    ) {
      response.writeHead(200, {
        'Content-Type': 'application/json'
      });
      response.end(
        JSON.stringify([
          { externalId: 'R-1', status: 'active' },
          { externalId: 'R-2', status: 'pending' }
        ])
      );
      return;
    }

    response.writeHead(401, {
      'Content-Type': 'application/json'
    });
    response.end(JSON.stringify({ message: 'unauthorized' }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to start test server');
  }

  const connector = await prisma.connectorConfig.create({
    data: {
      tenantId: tenant.id,
      adapterKey: 'rest-api',
      name: 'Test REST Connector',
      status: 'ACTIVE',
      config: {
        baseUrl: `http://127.0.0.1:${address.port}`,
        authToken: 'test-token',
        endpointPath: '/records'
      }
    }
  });

  const importedEvents: Array<Record<string, unknown>> = [];
  const unsubscribe = subscribe('connector.record.imported', async (event) => {
    importedEvents.push(event.payload.record);
  });

  try {
    const job = await enqueueJob({
      type: 'connector.sync',
      tenantId: tenant.id,
      payload: {
        connectorId: connector.id,
        connectorType: 'rest-api'
      }
    });

    await runNextJob();

    const storedJob = await getJobById(job.id);
    const updatedConnector = await prisma.connectorConfig.findUniqueOrThrow({
      where: { id: connector.id }
    });

    assert.equal(storedJob?.status, JOB_STATUS.SUCCEEDED);
    assert.ok(updatedConnector.lastSyncAt);
    assert.equal(importedEvents.length, 2);
  } finally {
    unsubscribe();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('rest adapter failures retry via job queue', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  let requestCount = 0;
  const server = createServer((request, response) => {
    if (request.url === '/retry-records') {
      requestCount += 1;

      if (requestCount === 1) {
        response.writeHead(500, {
          'Content-Type': 'application/json'
        });
        response.end(JSON.stringify({ message: 'temporary failure' }));
        return;
      }

      response.writeHead(200, {
        'Content-Type': 'application/json'
      });
      response.end(JSON.stringify([{ externalId: 'R-3', status: 'active' }]));
      return;
    }

    response.writeHead(404).end();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Unable to start test server');
  }

  const connector = await prisma.connectorConfig.create({
    data: {
      tenantId: tenant.id,
      adapterKey: 'rest-api',
      name: 'Test REST Retry Connector',
      status: 'ACTIVE',
      config: {
        baseUrl: `http://127.0.0.1:${address.port}`,
        authToken: 'retry-token',
        endpointPath: '/retry-records'
      }
    }
  });

  try {
    const job = await enqueueJob({
      type: 'connector.sync',
      tenantId: tenant.id,
      payload: {
        connectorId: connector.id,
        connectorType: 'rest-api'
      },
      maxAttempts: 2
    });

    await runNextJob();

    let storedJob = await getJobById(job.id);
    assert.equal(storedJob?.status, JOB_STATUS.PENDING);
    assert.match(storedJob?.lastError ?? '', /REST adapter request failed with 500/);

    await prisma.job.update({
      where: {
        id: job.id
      },
      data: {
        runAt: new Date()
      }
    });

    await runNextJob();

    storedJob = await getJobById(job.id);
    const updatedConnector = await prisma.connectorConfig.findUniqueOrThrow({
      where: { id: connector.id }
    });

    assert.equal(storedJob?.status, JOB_STATUS.SUCCEEDED);
    assert.ok(updatedConnector.lastSyncAt);
    assert.equal(requestCount, 2);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
