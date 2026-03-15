export interface BaseEvent {
  id: string;
  type: PlatformEventType;
  timestamp: Date;
  tenantId: string | null;
  correlationId: string;
}

export interface UserCreatedEvent extends BaseEvent {
  type: 'user.created';
  payload: {
    userId: string;
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export interface TenantCreatedEvent extends BaseEvent {
  type: 'tenant.created';
  payload: {
    tenantId: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  };
}

export interface DocumentUploadedEvent extends BaseEvent {
  type: 'document.uploaded';
  payload: {
    documentId: string;
    fileName: string;
    contentType: string;
    uploadedByUserId?: string | null;
  };
}

export interface WorkflowStartedEvent extends BaseEvent {
  type: 'workflow.started';
  payload: {
    workflowId: string;
    workflowType: string;
    initiatedByUserId?: string | null;
    input?: Record<string, unknown>;
  };
}

export interface WorkflowCompletedEvent extends BaseEvent {
  type: 'workflow.completed';
  payload: {
    workflowId: string;
    workflowType: string;
    status: 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
    completedByUserId?: string | null;
    result?: Record<string, unknown>;
  };
}

export interface NotificationRequestedEvent extends BaseEvent {
  type: 'notification.requested';
  payload: {
    notificationId: string;
    channel: 'email' | 'sms' | 'push' | 'in_app';
    recipientId: string;
    templateKey: string;
  };
}

export interface NotificationSentEvent extends BaseEvent {
  type: 'notification.sent';
  payload: {
    notificationId: string;
    channel: 'email' | 'sms' | 'push' | 'in_app';
    recipientId?: string | null;
    templateKey: string;
    sentAt: Date;
  };
}

export interface IntegrationRequestedEvent extends BaseEvent {
  type: 'integration.requested';
  payload: {
    integrationId: string;
    integrationKey: string;
    requestedByUserId?: string | null;
    jobId?: string | null;
  };
}

export interface IntegrationCompletedEvent extends BaseEvent {
  type: 'integration.completed';
  payload: {
    integrationId: string;
    integrationKey: string;
    status: 'SUCCEEDED' | 'FAILED';
    completedAt: Date;
    recordsProcessed?: number;
  };
}

export interface ConnectorRecordImportedEvent extends BaseEvent {
  type: 'connector.record.imported';
  payload: {
    adapterKey: string;
    fileName: string;
    record: Record<string, unknown>;
  };
}

export interface EnrollmentCreatedEvent extends BaseEvent {
  type: 'enrollment.created';
  payload: {
    enrollmentId: string;
    householdId: string;
    effectiveDate: string;
    status: string;
  };
}

export interface EnrollmentUpdatedEvent extends BaseEvent {
  type: 'enrollment.updated';
  payload: {
    enrollmentId: string;
    stepKey: string;
    status: string;
    completionPercent: number;
  };
}

export interface EnrollmentSubmittedEvent extends BaseEvent {
  type: 'enrollment.submitted';
  payload: {
    enrollmentId: string;
    submittedAt: string;
    status: string;
  };
}

export interface EnrollmentCompletedEvent extends BaseEvent {
  type: 'enrollment.completed';
  payload: {
    enrollmentId: string;
    completedAt: string;
    status: string;
  };
}

export type PlatformEvent =
  | UserCreatedEvent
  | TenantCreatedEvent
  | DocumentUploadedEvent
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | NotificationRequestedEvent
  | NotificationSentEvent
  | IntegrationRequestedEvent
  | IntegrationCompletedEvent
  | ConnectorRecordImportedEvent
  | EnrollmentCreatedEvent
  | EnrollmentUpdatedEvent
  | EnrollmentSubmittedEvent
  | EnrollmentCompletedEvent;

export type PlatformEventType = PlatformEvent['type'];

export const PLATFORM_EVENT_TYPES: PlatformEventType[] = [
  'user.created',
  'tenant.created',
  'document.uploaded',
  'workflow.started',
  'workflow.completed',
  'notification.requested',
  'notification.sent',
  'integration.requested',
  'integration.completed',
  'connector.record.imported',
  'enrollment.created',
  'enrollment.updated',
  'enrollment.submitted',
  'enrollment.completed'
];
