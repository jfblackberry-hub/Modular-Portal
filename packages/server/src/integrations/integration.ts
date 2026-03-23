import type { Prisma } from '@payer-portal/database';

import type { PlatformEvent } from '../events/eventTypes.js';

export const INTEGRATION_TRIGGER_MODE = {
  EVENT: 'EVENT',
  MANUAL: 'MANUAL',
  SCHEDULED: 'SCHEDULED'
} as const;

export type IntegrationTriggerMode =
  (typeof INTEGRATION_TRIGGER_MODE)[keyof typeof INTEGRATION_TRIGGER_MODE];

export const INTEGRATION_EXECUTION_STATUS = {
  FAILED: 'FAILED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED'
} as const;

export type IntegrationExecutionStatus =
  (typeof INTEGRATION_EXECUTION_STATUS)[keyof typeof INTEGRATION_EXECUTION_STATUS];

export type IntegrationAuthentication =
  | {
      type: 'apiKey';
      headerName?: string;
      value: string;
    }
  | {
      type: 'basic';
      password: string;
      username: string;
    }
  | {
      type: 'bearer';
      token: string;
    }
  | {
      type: 'none';
    };

export type IntegrationLoggingContext = {
  connectorId: string;
  tenantId: string;
  triggerMode: IntegrationTriggerMode;
};

export type IntegrationLogger = {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
};

export type IntegrationAuditTrail = {
  record(input: {
    action: string;
    actorUserId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void>;
};

export type IntegrationExecutionContext = {
  attempt: number;
  audit: IntegrationAuditTrail;
  event?: PlatformEvent;
  logger: IntegrationLogger;
  requestedByUserId?: string | null;
  tenantId: string;
  triggerMode: IntegrationTriggerMode;
};

export type IntegrationCapabilities = {
  authentication: boolean;
  eventTrigger: boolean;
  fileBased: boolean;
  healthCheck: boolean;
  rest: boolean;
  retries: boolean;
  scheduled: boolean;
  sync: boolean;
  webhook: boolean;
};

export type IntegrationHealthCheckResult = {
  ok: boolean;
  message?: string;
};

export type IntegrationSyncResult = {
  ok: boolean;
  message?: string;
  eventsPublished?: number;
  metadata?: Record<string, unknown>;
  recordsProcessed?: number;
};

export type IntegrationTrigger = {
  eventName?: string;
  mode?: string;
  schedule?: string;
};

export interface IntegrationAdapter<
  TConfig = Record<string, unknown>,
  TValidatedConfig = TConfig
> {
  key: string;
  capabilities?: Partial<IntegrationCapabilities>;
  description?: string;
  validateConfig(config: TConfig): Promise<TValidatedConfig> | TValidatedConfig;
  healthCheck(
    config: TValidatedConfig,
    context: IntegrationExecutionContext
  ): Promise<IntegrationHealthCheckResult> | IntegrationHealthCheckResult;
  sync(
    config: TValidatedConfig,
    context: IntegrationExecutionContext
  ): Promise<IntegrationSyncResult> | IntegrationSyncResult;
}

export type RegisteredIntegrationAdapter = IntegrationAdapter<
  Record<string, unknown>,
  unknown
>;

export type IntegrationAdapterModule = {
  adapter?: RegisteredIntegrationAdapter;
  default?: RegisteredIntegrationAdapter;
};
