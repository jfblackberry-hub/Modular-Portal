import assert from 'node:assert/strict';
import { after, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';
process.env.PAYER_PORTAL_API_AUTOSTART = 'false';

import { prisma } from '@payer-portal/database';
import { publish, recordIntegrationExecution } from '@payer-portal/server';

after(async () => {
  await prisma.$disconnect();
});

test('metrics endpoint exposes core platform metrics', async () => {
  const { buildServer } = await import('../src/server.js');
  const app = buildServer();

  await app.inject({
    method: 'GET',
    url: '/health'
  });

  await app.inject({
    method: 'GET',
    url: '/does-not-exist'
  });

  await publish('workflow.started', {
    id: 'workflow-started-metrics',
    correlationId: 'workflow-metrics',
    timestamp: new Date('2026-03-14T10:00:00.000Z'),
    tenantId: null,
    type: 'workflow.started',
    payload: {
      workflowId: 'wf-metrics',
      workflowType: 'monitoring-test',
      initiatedByUserId: null,
      input: {}
    }
  });

  await publish('workflow.completed', {
    id: 'workflow-completed-metrics',
    correlationId: 'workflow-metrics',
    timestamp: new Date('2026-03-14T10:00:01.500Z'),
    tenantId: null,
    type: 'workflow.completed',
    payload: {
      workflowId: 'wf-metrics',
      workflowType: 'monitoring-test',
      status: 'SUCCEEDED',
      completedByUserId: null,
      result: {}
    }
  });

  await publish('notification.sent', {
    id: 'notification-sent-metrics',
    correlationId: 'notification-metrics',
    timestamp: new Date(),
    tenantId: null,
    type: 'notification.sent',
    payload: {
      notificationId: 'notification-metrics',
      channel: 'email',
      recipientId: 'recipient-1',
      templateKey: 'metrics-template',
      sentAt: new Date()
    }
  });

  recordIntegrationExecution({
    adapterKey: 'rest-api',
    durationMs: 125,
    status: 'SUCCEEDED',
    triggerMode: 'MANUAL'
  });

  const response = await app.inject({
    method: 'GET',
    url: '/metrics'
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['content-type'] ?? '', /text\/plain/);

  const body = response.body;
  assert.match(body, /platform_api_requests_total/);
  assert.match(body, /platform_api_latency_ms/);
  assert.match(body, /platform_api_errors_total/);
  assert.match(body, /platform_workflow_execution_duration_ms/);
  assert.match(body, /platform_notification_sent_total/);
  assert.match(body, /platform_integration_activity_total/);
  assert.match(body, /platform_integration_execution_duration_ms/);

  await app.close();
});
