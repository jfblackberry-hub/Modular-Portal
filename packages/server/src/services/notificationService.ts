import { randomUUID } from 'node:crypto';

import type { Notification } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { publishInBackground } from '../events/eventBus.js';
import { enqueueJob } from '../jobs/jobQueue.js';
import { consoleEmailProvider } from '../providers/consoleEmailProvider.js';
import type { EmailProvider } from '../providers/emailProvider.js';
import { getNotificationSettingsForTenant } from './tenantSettingsService.js';

export const NOTIFICATION_STATUS = {
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  SENT: 'SENT'
} as const;

export const NOTIFICATION_CHANNEL = {
  EMAIL: 'EMAIL',
  IN_APP: 'IN_APP'
} as const;

type NotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];
type NotificationChannel =
  (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

let emailProvider: EmailProvider = consoleEmailProvider;

export type CreateNotificationInput = {
  tenantId: string;
  userId?: string | null;
  channel: string;
  template: string;
  subject?: string | null;
  body: string;
};

export type GetUserNotificationsInput = {
  tenantId: string;
  userId: string;
  channel?: string;
  limit?: number;
};

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeChannel(value: string): NotificationChannel {
  const normalized = value.trim().toUpperCase();

  if (normalized === 'EMAIL') {
    return NOTIFICATION_CHANNEL.EMAIL;
  }

  if (normalized === 'IN_APP' || normalized === 'IN-APP') {
    return NOTIFICATION_CHANNEL.IN_APP;
  }

  throw new Error('channel must be EMAIL or IN_APP');
}

function normalizeLimit(limit?: number) {
  if (!limit || limit <= 0) {
    return 50;
  }

  return Math.min(Math.floor(limit), 200);
}

export function setEmailProvider(provider: EmailProvider) {
  emailProvider = provider;
}

export function resetEmailProvider() {
  emailProvider = consoleEmailProvider;
}

export function getEmailProvider() {
  return emailProvider;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const notification = await prisma.notification.create({
    data: {
      tenantId: normalizeRequired(input.tenantId, 'tenantId'),
      userId: normalizeOptional(input.userId),
      channel: normalizeChannel(input.channel),
      template: normalizeRequired(input.template, 'template'),
      subject: normalizeOptional(input.subject),
      body: normalizeRequired(input.body, 'body'),
      status: NOTIFICATION_STATUS.PENDING,
      sentAt: null,
      readAt: null
    }
  });

  publishInBackground('notification.requested', {
    id: randomUUID(),
    correlationId: randomUUID(),
    timestamp: new Date(),
    tenantId: notification.tenantId,
    type: 'notification.requested',
    payload: {
      notificationId: notification.id,
      channel: notification.channel === NOTIFICATION_CHANNEL.EMAIL ? 'email' : 'in_app',
      recipientId: notification.userId ?? notification.id,
      templateKey: notification.template
    }
  });

  await sendNotification(notification.id);

  return prisma.notification.findUniqueOrThrow({
    where: {
      id: notification.id
    }
  });
}

export async function sendNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: {
      id: normalizeRequired(notificationId, 'notificationId')
    }
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  const settings = await getNotificationSettingsForTenant(notification.tenantId);

  if (
    (notification.channel === NOTIFICATION_CHANNEL.EMAIL && !settings.emailEnabled) ||
    (notification.channel === NOTIFICATION_CHANNEL.IN_APP && !settings.inAppEnabled)
  ) {
    return markNotificationStatus(notification.id, {
      status: NOTIFICATION_STATUS.FAILED,
      sentAt: null
    });
  }

  return enqueueJob({
    type: 'notification.send',
    tenantId: notification.tenantId,
    payload: {
      notificationId: notification.id,
      channel:
        notification.channel === NOTIFICATION_CHANNEL.EMAIL ? 'email' : 'in_app',
      recipientId: notification.userId ?? undefined,
      templateKey: notification.template
    }
  });
}

export async function deliverNotification(notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: {
      id: normalizeRequired(notificationId, 'notificationId')
    }
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  const settings = await getNotificationSettingsForTenant(notification.tenantId);

  if (
    (notification.channel === NOTIFICATION_CHANNEL.EMAIL && !settings.emailEnabled) ||
    (notification.channel === NOTIFICATION_CHANNEL.IN_APP && !settings.inAppEnabled)
  ) {
    return markNotificationStatus(notification.id, {
      status: NOTIFICATION_STATUS.FAILED,
      sentAt: null
    });
  }

  if (notification.channel === NOTIFICATION_CHANNEL.IN_APP) {
    const sentNotification = await markNotificationStatus(notification.id, {
      status: NOTIFICATION_STATUS.SENT,
      sentAt: new Date()
    });

    publishInBackground('notification.sent', {
      id: randomUUID(),
      correlationId: randomUUID(),
      timestamp: sentNotification.sentAt ?? new Date(),
      tenantId: sentNotification.tenantId,
      type: 'notification.sent',
      payload: {
        notificationId: sentNotification.id,
        channel: 'in_app',
        recipientId: sentNotification.userId,
        templateKey: sentNotification.template,
        sentAt: sentNotification.sentAt ?? new Date()
      }
    });

    return sentNotification;
  }

  const user = notification.userId
    ? await prisma.user.findUnique({
        where: {
          id: notification.userId
        },
        select: {
          email: true
        }
      })
    : null;

  if (!user?.email) {
    await markNotificationStatus(notification.id, {
      status: NOTIFICATION_STATUS.FAILED,
      sentAt: null
    });
    throw new Error('Email notification requires a recipient email');
  }

  try {
    await emailProvider.sendEmail(
      user.email,
      notification.subject ?? notification.template,
      notification.body
    );
  } catch (error) {
    await markNotificationStatus(notification.id, {
      status: NOTIFICATION_STATUS.FAILED,
      sentAt: null
    });
    throw error;
  }

  const sentNotification = await markNotificationStatus(notification.id, {
    status: NOTIFICATION_STATUS.SENT,
    sentAt: new Date()
  });

  publishInBackground('notification.sent', {
    id: randomUUID(),
    correlationId: randomUUID(),
    timestamp: sentNotification.sentAt ?? new Date(),
    tenantId: sentNotification.tenantId,
    type: 'notification.sent',
    payload: {
      notificationId: sentNotification.id,
      channel: 'email',
      recipientId: sentNotification.userId,
      templateKey: sentNotification.template,
      sentAt: sentNotification.sentAt ?? new Date()
    }
  });

  return sentNotification;
}

export async function getUserNotifications(
  input: GetUserNotificationsInput
): Promise<Notification[]> {
  const channel = input.channel ? normalizeChannel(input.channel) : undefined;

  return prisma.notification.findMany({
    where: {
      tenantId: normalizeRequired(input.tenantId, 'tenantId'),
      userId: normalizeRequired(input.userId, 'userId'),
      channel
    },
    orderBy: [{ createdAt: 'desc' }],
    take: normalizeLimit(input.limit)
  });
}

export async function markNotificationRead(
  notificationId: string,
  input: {
    tenantId: string;
    userId: string;
  }
): Promise<Notification> {
  const notification = await prisma.notification.findFirst({
    where: {
      id: normalizeRequired(notificationId, 'notificationId'),
      tenantId: normalizeRequired(input.tenantId, 'tenantId'),
      userId: normalizeRequired(input.userId, 'userId')
    }
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  if (notification.readAt) {
    return notification;
  }

  return prisma.notification.update({
    where: { id: notification.id },
    data: {
      readAt: new Date()
    }
  });
}

export async function markNotificationStatus(
  notificationId: string,
  input: {
    status: NotificationStatus;
    sentAt?: Date | null;
  }
): Promise<Notification> {
  return prisma.notification.update({
    where: {
      id: normalizeRequired(notificationId, 'notificationId')
    },
    data: {
      status: input.status,
      sentAt: input.sentAt ?? null
    }
  });
}
