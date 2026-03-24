import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';

process.env.DATABASE_URL ??=
  'postgresql://dev:dev@127.0.0.1:5432/payer_portal?schema=public';

import { prisma } from '@payer-portal/database';

import { listJobs } from '../src/jobs/jobQueue.js';
import { createNotification, NOTIFICATION_STATUS } from '../src/services/notificationService.js';
import { getNotificationSettingsForTenant, updateNotificationSettingsForTenant } from '../src/services/tenantSettingsService.js';

const TEST_TENANT_SLUG = 'tenant-settings-service-test';
const TEST_USER_EMAIL = 'tenant-settings-user@example.com';

async function cleanupTestData() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs');

  await prisma.job.deleteMany({
    where: {
      type: 'notification.send'
    }
  });

  await prisma.notification.deleteMany({
    where: {
      template: 'tenant-settings-disabled'
    }
  });

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
  await cleanupTestData();
});

after(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test('tenant notification settings are persisted and applied dynamically to delivery', async () => {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Tenant Settings Test',
      slug: TEST_TENANT_SLUG,
      status: 'ACTIVE',
      brandingConfig: {}
    }
  });

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: TEST_USER_EMAIL,
      firstName: 'Tenant',
      lastName: 'Settings'
    }
  });

  const defaultSettings = await getNotificationSettingsForTenant(tenant.id);
  assert.equal(defaultSettings.emailEnabled, true);
  assert.equal(defaultSettings.inAppEnabled, true);

  const updatedSettings = await updateNotificationSettingsForTenant(tenant.id, {
    emailEnabled: false,
    digestEnabled: true,
    senderName: 'Tenant Support'
  });

  assert.equal(updatedSettings.emailEnabled, false);
  assert.equal(updatedSettings.digestEnabled, true);
  assert.equal(updatedSettings.senderName, 'Tenant Support');

  const notification = await createNotification({
    tenantId: tenant.id,
    userId: user.id,
    channel: 'EMAIL',
    template: 'tenant-settings-disabled',
    subject: 'Email disabled',
    body: 'This should not enqueue a send job.'
  });

  assert.equal(notification.status, NOTIFICATION_STATUS.FAILED);

  const queuedJobs = await listJobs({
    type: 'notification.send',
    tenantId: tenant.id
  });

  assert.equal(queuedJobs.length, 0);
});
