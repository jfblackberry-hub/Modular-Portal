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
  assert.equal(livenessAliasResponse.json().service, 'api');

  assert.equal(readyResponse.statusCode, 200);
  const readyPayload = readyResponse.json();
  assert.equal(readyPayload.service, 'api');
  assert.equal(readyPayload.status, 'ok');
  assert.equal(readyPayload.checks.database.status, 'pass');
  assert.equal(readyPayload.checks.storage.status, 'pass');
  assert.equal(
    ['pass', 'not_configured'].includes(readyPayload.checks.integrations.status),
    true
  );
  assert.equal(readyPayload.checks.redis.status, 'not_configured');
  assert.equal(readinessAliasResponse.statusCode, 200);
  assert.equal(readinessAliasResponse.json().service, 'api');

  assert.equal(aggregateResponse.statusCode, 200);
  const aggregatePayload = aggregateResponse.json();
  assert.equal(aggregatePayload.status, 'ok');
  assert.ok(typeof aggregatePayload.timestamp === 'string');

  await app.close();
});
