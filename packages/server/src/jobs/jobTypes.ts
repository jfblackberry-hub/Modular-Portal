import type { Job, Prisma } from '@payer-portal/database';

import type { PlatformEventType } from '../events/eventTypes.js';

export const JOB_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED'
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const DEFAULT_JOB_MAX_ATTEMPTS = 3;

export type QueuedPlatformEvent = {
  capabilityId: string;
  correlationId: string;
  failureType: string;
  id: string;
  orgUnitId?: string | null;
  payload: Prisma.JsonValue;
  tenantId: string;
  timestamp: string;
  type: PlatformEventType;
};

export type RegisteredJobPayloads = {
  'provider.workflow.execute': {
    workflowExecutionId: string;
    initiatedByUserId?: string | null;
    personaCode?: string | null;
    organizationUnitId?: string | null;
    actionType: string;
    targetType: string;
    targetId: string;
    capabilityId: string;
    widgetId?: string | null;
  };
  'event.publish': {
    event: QueuedPlatformEvent;
  };
  'backup.run': {
    coverage: 'database' | 'documents' | 'audit_logs';
    schedule?: {
      intervalHours: number;
    } | null;
    trigger?: 'MANUAL' | 'SCHEDULED';
  };
  'notification.send': {
    notificationId: string;
    channel?: 'email' | 'sms' | 'push' | 'in_app';
    recipientId?: string;
    templateKey?: string;
  };
  'connector.sync': {
    connectorId: string;
    connectorType?: string;
    event?: QueuedPlatformEvent;
    requestedByUserId?: string | null;
    triggerEvent?: string;
    triggerMode?: 'EVENT' | 'MANUAL' | 'SCHEDULED';
  };
  'document.process': {
    documentId: string;
    uploadedByUserId?: string | null;
  };
  'search.index': {
    entityType: string;
    entityId: string;
    sourceEvent?: string;
  };
};

export type RegisteredJobType = keyof RegisteredJobPayloads;

export type JobPayload = Prisma.InputJsonValue;

export type JobRecord<TPayload = Prisma.JsonValue> = Job & {
  payload: TPayload;
};

export type EnqueueJobInput<
  TType extends string = string,
  TPayload extends JobPayload = JobPayload
> = {
  type: TType;
  tenantId?: string | null;
  payload: TPayload;
  runAt?: Date;
  maxAttempts?: number;
};
