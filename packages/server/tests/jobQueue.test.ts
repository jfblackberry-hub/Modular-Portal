import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import { clearJobHandlers, registerJobHandler } from '../src/jobs/jobRegistry.js';
import { enqueueJob, getJobById, listJobs } from '../src/jobs/jobQueue.js';
import { JOB_STATUS } from '../src/jobs/jobTypes.js';
import { getConsoleEmailLogPath } from '../src/providers/consoleEmailProvider.js';
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  NOTIFICATION_STATUS,
  resetEmailProvider,
  setEmailProvider
} from '../src/services/notificationService.js';
import { runNextJob } from '../src/jobs/jobWorker.js';

const TEST_PREFIX = 'test.jobs.';

async function cleanupJobs() {
  await prisma.job.deleteMany({
    where: {
      type: {
        startsWith: TEST_PREFIX
      }
    }
  });
}

async function cleanupNotifications() {
  await prisma.notification.deleteMany({
    where: {
      template: 'test-job-notification'
    }
  });
}

async function cleanupEmailDevLog() {
  await rm(getConsoleEmailLogPath(), { force: true });
}

async function suspendSeedJobs() {
  await prisma.job.updateMany({
    where: {
      NOT: {
        type: {
          startsWith: TEST_PREFIX
        }
      },
      status: JOB_STATUS.PENDING
    },
    data: {
      runAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });
}

beforeEach(async () => {
  clearJobHandlers();
  resetEmailProvider();
  await cleanupJobs();
  await cleanupNotifications();
  await cleanupEmailDevLog();
  await suspendSeedJobs();
});

after(async () => {
  clearJobHandlers();
  resetEmailProvider();
  await cleanupJobs();
  await cleanupNotifications();
  await cleanupEmailDevLog();
  await prisma.$disconnect();
});

test('enqueueJob creates a pending job', async () => {
  const job = await enqueueJob({
    type: `${TEST_PREFIX}enqueue`,
    payload: {
      hello: 'world'
    }
  });

  assert.equal(job.status, JOB_STATUS.PENDING);
  assert.equal(job.attempts, 0);

  const stored = await getJobById(job.id);
  assert.ok(stored);
  assert.equal(stored?.status, JOB_STATUS.PENDING);
});

test('worker executes a registered handler and marks succeeded', async () => {
  let handledJobId = '';

  registerJobHandler(`${TEST_PREFIX}succeed`, async ({ job }) => {
    handledJobId = job.id;
  });

  const job = await enqueueJob({
    type: `${TEST_PREFIX}succeed`,
    payload: {
      ok: true
    }
  });

  const processed = await runNextJob();
  assert.equal(processed, true);
  assert.equal(handledJobId, job.id);

  const stored = await getJobById(job.id);
  assert.equal(stored?.status, JOB_STATUS.SUCCEEDED);
  assert.equal(stored?.attempts, 1);
});

test('failed handler retries with backoff', async () => {
  registerJobHandler(`${TEST_PREFIX}retry`, async () => {
    throw new Error('retry me');
  });

  const job = await enqueueJob({
    type: `${TEST_PREFIX}retry`,
    payload: {
      retry: true
    },
    maxAttempts: 3
  });

  await runNextJob();

  const stored = await getJobById(job.id);
  assert.equal(stored?.status, JOB_STATUS.PENDING);
  assert.equal(stored?.attempts, 1);
  assert.equal(stored?.lastError, 'retry me');
  assert.ok(stored?.runAt);
  assert.ok(stored.runAt.getTime() > Date.now() + 50_000);
});

test('failed job becomes failed after max attempts', async () => {
  registerJobHandler(`${TEST_PREFIX}fail`, async () => {
    throw new Error('still failing');
  });

  const job = await enqueueJob({
    type: `${TEST_PREFIX}fail`,
    payload: {
      fail: true
    },
    maxAttempts: 1
  });

  await runNextJob();

  const stored = await getJobById(job.id);
  assert.equal(stored?.status, JOB_STATUS.FAILED);
  assert.equal(stored?.attempts, 1);
  assert.equal(stored?.lastError, 'still failing');
});

test('unknown job type is handled safely', async () => {
  const job = await enqueueJob({
    type: `${TEST_PREFIX}unknown`,
    payload: {
      mystery: true
    },
    maxAttempts: 1
  });

  await runNextJob();

  const stored = await getJobById(job.id);
  assert.equal(stored?.status, JOB_STATUS.FAILED);
  assert.match(stored?.lastError ?? '', /No job handler registered/);
});

test('listJobs returns newest first and supports filtering', async () => {
  await enqueueJob({
    type: `${TEST_PREFIX}filter-a`,
    payload: {
      id: 'a'
    }
  });

  await enqueueJob({
    type: `${TEST_PREFIX}filter-b`,
    payload: {
      id: 'b'
    }
  });

  const jobs = await listJobs({
    type: `${TEST_PREFIX}filter-b`
  });

  assert.equal(jobs.length, 1);
  assert.equal(jobs[0]?.type, `${TEST_PREFIX}filter-b`);
});

test('notification.send job creates a notification record', async () => {
  const user = await prisma.user.findFirstOrThrow({
    select: {
      id: true,
      tenantId: true
    }
  });

  const notification = await createNotification({
    tenantId: user.tenantId,
    userId: user.id,
    channel: 'EMAIL',
    template: 'test-job-notification',
    subject: 'Test notification',
    body: 'Notification body'
  });

  await runNextJob();

  const jobs = await listJobs({
    type: 'notification.send',
    tenantId: user.tenantId
  });
  const storedJob = jobs.find(
    (job) =>
      typeof job.payload === 'object' &&
      job.payload !== null &&
      'notificationId' in job.payload &&
      job.payload.notificationId === notification.id
  );
  const storedNotification = await prisma.notification.findFirst({
    where: {
      tenantId: user.tenantId,
      userId: user.id,
      template: 'test-job-notification'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const emailLog = await readFile(getConsoleEmailLogPath(), 'utf8');

  assert.equal(storedJob?.status, JOB_STATUS.SUCCEEDED);
  assert.equal(storedNotification?.channel, 'EMAIL');
  assert.equal(storedNotification?.status, 'SENT');
  assert.match(emailLog, /subject=Test notification/);
  assert.match(emailLog, /Notification body/);
});

test('getUserNotifications returns tenant-scoped notifications and markNotificationRead updates readAt', async () => {
  const user = await prisma.user.findFirstOrThrow({
    select: {
      id: true,
      tenantId: true
    }
  });

  const notification = await createNotification({
    tenantId: user.tenantId,
    userId: user.id,
    channel: 'IN_APP',
    template: 'test-job-notification',
    subject: 'Inbox item',
    body: 'Read me'
  });

  const notifications = await getUserNotifications({
    tenantId: user.tenantId,
    userId: user.id,
    channel: 'IN_APP'
  });

  assert.equal(notifications.some((item) => item.id === notification.id), true);
  assert.equal(notification.status, NOTIFICATION_STATUS.PENDING);

  const updated = await markNotificationRead(notification.id, {
    tenantId: user.tenantId,
    userId: user.id
  });

  assert.ok(updated.readAt);
});

test('email provider failure updates notification status to failed', async () => {
  const user = await prisma.user.findFirstOrThrow({
    select: {
      id: true,
      tenantId: true
    }
  });

  setEmailProvider({
    async sendEmail() {
      throw new Error('provider unavailable');
    }
  });

  const notification = await createNotification({
    tenantId: user.tenantId,
    userId: user.id,
    channel: 'EMAIL',
    template: 'test-job-notification',
    subject: 'Broken notification',
    body: 'This will fail'
  });

  await runNextJob();

  const storedNotification = await prisma.notification.findUniqueOrThrow({
    where: {
      id: notification.id
    }
  });
  const jobs = await listJobs({
    type: 'notification.send',
    tenantId: user.tenantId
  });
  const storedJob = jobs.find(
    (job) =>
      typeof job.payload === 'object' &&
      job.payload !== null &&
      'notificationId' in job.payload &&
      job.payload.notificationId === notification.id
  );

  assert.equal(storedNotification.status, NOTIFICATION_STATUS.FAILED);
  assert.equal(storedNotification.sentAt, null);
  assert.equal(storedJob?.status, JOB_STATUS.PENDING);
});
