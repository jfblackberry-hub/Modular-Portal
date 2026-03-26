import assert from 'node:assert/strict';
import { after, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';
process.env.PAYER_PORTAL_API_AUTOSTART = 'false';
delete process.env.REDIS_URL;

import { prisma } from '@payer-portal/database';

after(async () => {
  await prisma.$disconnect();
});

test('health endpoints expose live and readiness probes with dependency checks', async () => {
  const { buildServer } = await import('../src/server.js');
  const app = buildServer();

  const liveResponse = await app.inject({
    method: 'GET',
    url: '/health/live'
  });
  const livenessAliasResponse = await app.inject({
    method: 'GET',
    url: '/liveness'
  });
  const readyResponse = await app.inject({
    method: 'GET',
    url: '/health/ready'
  });
  const readinessAliasResponse = await app.inject({
    method: 'GET',
    url: '/readiness'
  });
  const aggregateResponse = await app.inject({
    method: 'GET',
    url: '/health'
  });

  assert.equal(liveResponse.statusCode, 200);
  assert.equal(liveResponse.json().status, 'ok');
  assert.equal(livenessAliasResponse.statusCode, 200);
  assert.equal(livenessAliasResponse.json().checks.process, 'ok');

  assert.equal(readyResponse.statusCode, 503);
  const readyPayload = readyResponse.json();
  assert.equal(readyPayload.status, 'down');
  assert.equal(readyPayload.checks.db, 'ok');
  assert.equal(readyPayload.checks.config, 'down');
  assert.equal(readinessAliasResponse.statusCode, 503);
  assert.equal(readinessAliasResponse.json().status, 'down');

  assert.equal(aggregateResponse.statusCode, 503);
  const aggregatePayload = aggregateResponse.json();
  assert.equal(aggregatePayload.service, 'api');
  assert.equal(aggregatePayload.status, 'degraded');
  assert.ok(typeof aggregatePayload.timestamp === 'string');
  assert.equal(aggregatePayload.checks.database.status, 'pass');
  assert.equal(aggregatePayload.checks.storage.status, 'pass');
  assert.equal(aggregatePayload.checks.redis.status, 'not_configured');

  await app.close();
});
