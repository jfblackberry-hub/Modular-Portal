import type { Prisma } from '@payer-portal/database';

import { registerDefaultAdapters } from '../adapters/adapterRegistry.js';
import { runBackup, scheduleNextBackupRun } from '../backups/backupService.js';
import type { PlatformEvent } from '../events/eventTypes.js';
import { createStructuredLogger } from '../observability/logger.js';
import { runConnectorSync } from '../services/connectorService.js';
import {
  deliverNotification
} from '../services/notificationService.js';
import { jobWorkerRuntimeConfig } from './runtime-config.js';
import type { JobRecord, RegisteredJobPayloads, RegisteredJobType } from './jobTypes.js';

function hydrateQueuedEvent(event: RegisteredJobPayloads['connector.sync']['event']) {
  if (!event) {
    return undefined;
  }

  return {
    ...event,
    timestamp: new Date(event.timestamp)
  } as PlatformEvent;
}

export type JobHandler<
  TPayload extends Prisma.JsonValue = Prisma.JsonValue,
  TJob extends JobRecord = JobRecord
> = (input: { payload: TPayload; job: TJob }) => Promise<void> | void;

const handlers = new Map<string, JobHandler>();
let defaultsRegistered = false;

export function registerJobHandler<TType extends RegisteredJobType>(
  type: TType,
  handler: JobHandler<RegisteredJobPayloads[TType] & Prisma.JsonValue, JobRecord>
): void;
export function registerJobHandler(type: string, handler: JobHandler): void;
export function registerJobHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler);
}

export function getJobHandler(type: string) {
  return handlers.get(type);
}

export function clearJobHandlers() {
  handlers.clear();
  defaultsRegistered = false;
}

export function registerDefaultJobHandlers() {
  if (defaultsRegistered) {
    return;
  }

  defaultsRegistered = true;
  registerDefaultAdapters();
  const logger = createStructuredLogger({
    serviceName: jobWorkerRuntimeConfig.observability.serviceName
  });

  registerJobHandler('backup.run', async ({ payload, job }) => {
    const manifest = await runBackup(payload);

    logger.info('backup.run handled', {
      jobId: job.id,
      coverage: manifest.coverage,
      backupId: manifest.backupId,
      encryptedFile: manifest.encryptedFile
    });

    await scheduleNextBackupRun(payload, new Date());
  });

  registerJobHandler('notification.send', async ({ payload, job }) => {
    const notification = await deliverNotification(payload.notificationId);

    logger.info('notification.send handled', {
      jobId: job.id,
      tenantId: notification.tenantId,
      notificationId: notification.id,
      recipientId: notification.userId,
      channel: notification.channel
    });
  });

  registerJobHandler('connector.sync', async ({ payload, job }) => {
    const connector = await runConnectorSync(
      payload.connectorId,
      payload.requestedByUserId ?? null,
      payload.triggerMode,
      hydrateQueuedEvent(payload.event)
    );

    logger.info('connector.sync handled', {
      jobId: job.id,
      tenantId: connector.tenantId,
      connectorId: connector.id,
      adapterKey: connector.adapterKey,
      lastSyncAt: connector.lastSyncAt
    });
  });

  registerJobHandler('document.process', async ({ payload, job }) => {
    logger.info('document.process handled', {
      jobId: job.id,
      tenantId: job.tenantId,
      documentId: payload.documentId
    });
  });

  registerJobHandler('search.index', async ({ payload, job }) => {
    logger.info('search.index handled', {
      jobId: job.id,
      tenantId: job.tenantId,
      entityType: payload.entityType,
      entityId: payload.entityId
    });
  });
}
