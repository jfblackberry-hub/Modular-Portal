import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import {
  clearSubscriptions,
  EVENT_DELIVERY_STATUS,
  getDeadLetterQueue,
  getEventHistory,
  processPendingEventDeliveries,
  publish,
  subscribe
} from '../src/events/eventBus.js';

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitFor<T>(
  action: () => Promise<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 2_000
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const value = await action();

    if (predicate(value)) {
      return value;
    }

    await sleep(25);
  }

  return action();
}

beforeEach(async () => {
  clearSubscriptions();
  await prisma.eventDelivery.deleteMany();
  await prisma.eventRecord.deleteMany();
});

after(async () => {
  clearSubscriptions();
  await prisma.eventDelivery.deleteMany();
  await prisma.eventRecord.deleteMany();
  await prisma.$disconnect();
});

test('publish persists event history and delivers to subscribers', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  const receivedEventIds: string[] = [];
  const unsubscribe = subscribe(
    'tenant.created',
    async (event) => {
      receivedEventIds.push(event.id);
    },
    {
      subscriberId: 'test.tenant.created'
    }
  );

  try {
    const event = await publish('tenant.created', {
      id: 'tenant-created-1',
      correlationId: 'corr-tenant-created-1',
      timestamp: new Date(),
      tenantId: tenant.id,
      type: 'tenant.created',
      payload: {
        tenantId: tenant.id,
        name: 'Replay Health',
        slug: 'replay-health',
        status: 'ACTIVE'
      }
    });

    const history = await getEventHistory({
      eventType: 'tenant.created',
      correlationId: event.correlationId
    });
    const delivery = await waitFor(
      () =>
        prisma.eventDelivery.findFirst({
          where: {
            subscriberId: 'test.tenant.created'
          }
        }),
      (value) => value?.status === EVENT_DELIVERY_STATUS.DELIVERED
    );

    assert.deepEqual(receivedEventIds, ['tenant-created-1']);
    assert.equal(history.length, 1);
    assert.equal(history[0]?.id, 'tenant-created-1');
    assert.equal(delivery?.status, EVENT_DELIVERY_STATUS.DELIVERED);
    assert.equal(delivery?.attempts, 1);
  } finally {
    unsubscribe();
  }
});

test('failed deliveries retry and then succeed', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  let attempts = 0;
  const unsubscribe = subscribe(
    'user.created',
    async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new Error('temporary user sync failure');
      }
    },
    {
      subscriberId: 'test.user.retry',
      maxAttempts: 3
    }
  );

  try {
    await publish('user.created', {
      id: 'user-created-1',
      correlationId: 'corr-user-created-1',
      timestamp: new Date(),
      tenantId: tenant.id,
      type: 'user.created',
      payload: {
        userId: 'user-1',
        tenantId: tenant.id,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true
      }
    });

    const firstAttempt = await waitFor(
      () =>
        prisma.eventDelivery.findFirst({
          where: {
            subscriberId: 'test.user.retry'
          }
        }),
      (value) =>
        value?.status === EVENT_DELIVERY_STATUS.PENDING && value.attempts === 1
    );

    assert.equal(firstAttempt?.status, EVENT_DELIVERY_STATUS.PENDING);
    assert.equal(firstAttempt?.attempts, 1);

    await prisma.eventDelivery.update({
      where: {
        id: firstAttempt!.id
      },
      data: {
        nextAttemptAt: new Date(Date.now() - 1_000)
      }
    });

    await processPendingEventDeliveries();
    const finalAttempt = await waitFor(
      () =>
        prisma.eventDelivery.findFirst({
          where: {
            subscriberId: 'test.user.retry'
          }
        }),
      (value) => value?.status === EVENT_DELIVERY_STATUS.DELIVERED
    );

    assert.equal(attempts, 2);
    assert.equal(finalAttempt?.status, EVENT_DELIVERY_STATUS.DELIVERED);
    assert.equal(finalAttempt?.attempts, 2);
  } finally {
    unsubscribe();
  }
});

test('dead letter queue captures exhausted deliveries', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  const unsubscribe = subscribe(
    'document.uploaded',
    async () => {
      throw new Error('permanent subscriber failure');
    },
    {
      subscriberId: 'test.document.dead-letter',
      maxAttempts: 1
    }
  );

  try {
    await publish('document.uploaded', {
      id: 'document-uploaded-1',
      correlationId: 'corr-document-uploaded-1',
      timestamp: new Date(),
      tenantId: tenant.id,
      type: 'document.uploaded',
      payload: {
        documentId: 'document-1',
        fileName: 'test.pdf',
        contentType: 'application/pdf',
        uploadedByUserId: 'user-1'
      }
    });

    const deadLetters = await waitFor(
      () =>
        getDeadLetterQueue({
          eventType: 'document.uploaded',
          subscriberId: 'test.document.dead-letter'
        }),
      (value) => value.length === 1
    );

    assert.equal(deadLetters.length, 1);
    assert.equal(deadLetters[0]?.status, EVENT_DELIVERY_STATUS.DEAD_LETTER);
    assert.match(deadLetters[0]?.lastError ?? '', /permanent subscriber failure/);
  } finally {
    unsubscribe();
  }
});

test('subscriber replay receives persisted history', async () => {
  const tenant = await prisma.tenant.findFirstOrThrow({
    select: {
      id: true
    }
  });

  await publish('workflow.started', {
    id: 'workflow-started-1',
    correlationId: 'corr-workflow-1',
    timestamp: new Date(),
    tenantId: tenant.id,
    type: 'workflow.started',
    payload: {
      workflowId: 'wf-1',
      workflowType: 'onboarding',
      initiatedByUserId: 'user-1',
      input: {
        source: 'test'
      }
    }
  });

  const receivedWorkflowIds: string[] = [];
  const unsubscribe = subscribe(
    'workflow.started',
    async (event) => {
      receivedWorkflowIds.push(event.payload.workflowId);
    },
    {
      subscriberId: 'test.workflow.replay',
      replay: {
        limit: 10
      }
    }
  );

  try {
    await waitFor(
      async () => receivedWorkflowIds,
      (value) => value.length === 1
    );
    assert.deepEqual(receivedWorkflowIds, ['wf-1']);
  } finally {
    unsubscribe();
  }
});
