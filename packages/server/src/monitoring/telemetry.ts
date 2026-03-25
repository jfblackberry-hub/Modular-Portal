import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';

import { metrics } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { loadObservabilityConfig } from '@payer-portal/config';
import { prisma } from '@payer-portal/database';

import { subscribe } from '../events/eventBus.js';

const observabilityConfig = loadObservabilityConfig();
const prometheusPort = observabilityConfig.prometheusPort;
const prometheusPath = observabilityConfig.prometheusPath;

let initialized = false;
let subscriptionsRegistered = false;
let snapshotRefreshStarted = false;
let snapshotRefreshInFlight: Promise<void> | null = null;

const processStartedAtSeconds = Math.floor(Date.now() / 1000);
const SESSION_ACTIVITY_WINDOW_MS = 15 * 60 * 1000;
const SNAPSHOT_REFRESH_INTERVAL_MS = 30 * 1000;

const activeSessions = new Map<
  string,
  {
    lastSeenAt: number;
    sessionType: 'end_user' | 'platform_admin' | 'tenant_admin';
    tenantId: string;
    userId: string;
  }
>();
const activeUsers = new Map<
  string,
  {
    lastSeenAt: number;
    sessionType: 'end_user' | 'platform_admin' | 'tenant_admin';
    tenantId: string;
  }
>();

type MonitoringSnapshot = {
  activeTenantCounts: Record<'active' | 'inactive' | 'onboarding' | 'total', number>;
  activeUserCounts: Record<'active' | 'inactive' | 'total', number>;
  activePortalAuthHandoffs: number;
  activePreviewSessions: number;
  jobCounts: Record<'FAILED' | 'PENDING' | 'RUNNING' | 'SUCCEEDED', number>;
  oldestPendingJobAgeSeconds: number;
  refreshedAtSeconds: number;
  refreshSucceeded: boolean;
};

const monitoringSnapshot: MonitoringSnapshot = {
  activeTenantCounts: {
    active: 0,
    inactive: 0,
    onboarding: 0,
    total: 0
  },
  activeUserCounts: {
    active: 0,
    inactive: 0,
    total: 0
  },
  activePortalAuthHandoffs: 0,
  activePreviewSessions: 0,
  jobCounts: {
    FAILED: 0,
    PENDING: 0,
    RUNNING: 0,
    SUCCEEDED: 0
  },
  oldestPendingJobAgeSeconds: 0,
  refreshedAtSeconds: processStartedAtSeconds,
  refreshSucceeded: false
};

const exporter = new PrometheusExporter(
  {
    endpoint: prometheusPath,
    host: observabilityConfig.prometheusHost,
    port: prometheusPort
  },
  () => undefined
);

const meterProvider = new MeterProvider({
  readers: [exporter]
});

metrics.setGlobalMeterProvider(meterProvider);

const meter = metrics.getMeter(observabilityConfig.serviceName, '0.1.0');

const apiRequestCounter = meter.createCounter('platform_api_requests_total', {
  description: 'Total API requests processed by the platform API.'
});
const apiErrorCounter = meter.createCounter('platform_api_errors_total', {
  description: 'Total API requests resulting in error responses.'
});
const apiLatencyHistogram = meter.createHistogram('platform_api_latency_ms', {
  description: 'API request latency in milliseconds.',
  unit: 'ms'
});
const workflowDurationHistogram = meter.createHistogram(
  'platform_workflow_execution_duration_ms',
  {
    description: 'Workflow execution duration measured from started to completed events.',
    unit: 'ms'
  }
);
const notificationThroughputCounter = meter.createCounter(
  'platform_notification_sent_total',
  {
    description: 'Notifications successfully sent by channel.'
  }
);
const integrationActivityCounter = meter.createCounter(
  'platform_integration_activity_total',
  {
    description: 'Integration execution attempts by adapter, trigger mode, and status.'
  }
);
const integrationDurationHistogram = meter.createHistogram(
  'platform_integration_execution_duration_ms',
  {
    description: 'Integration execution duration in milliseconds.',
    unit: 'ms'
  }
);
const activeSessionGauge = meter.createObservableGauge('platform_active_sessions', {
  description:
    'Distinct authenticated sessions observed by the API in the recent activity window.'
});
const activeUserGauge = meter.createObservableGauge('platform_active_users', {
  description:
    'Distinct authenticated users observed by the API in the recent activity window.'
});
const jobQueueDepthGauge = meter.createObservableGauge('platform_job_queue_depth', {
  description: 'Current job queue depth grouped by status.'
});
const oldestPendingJobAgeGauge = meter.createObservableGauge(
  'platform_job_oldest_pending_age_seconds',
  {
    description: 'Age in seconds of the oldest pending job that is ready to run.',
    unit: 's'
  }
);
const tenantTotalGauge = meter.createObservableGauge('platform_tenants_total', {
  description: 'Total tenant count grouped by status.'
});
const userTotalGauge = meter.createObservableGauge('platform_users_total', {
  description: 'Total user count grouped by active state.'
});
const previewSessionGauge = meter.createObservableGauge(
  'platform_preview_sessions_active_total',
  {
    description: 'Current active preview sessions.'
  }
);
const portalAuthHandoffGauge = meter.createObservableGauge(
  'platform_portal_auth_handoffs_active_total',
  {
    description: 'Current unconsumed portal auth handoffs that have not expired.'
  }
);
const monitoringSnapshotTimestampGauge = meter.createObservableGauge(
  'platform_monitoring_snapshot_timestamp_seconds',
  {
    description: 'Unix timestamp of the last successful monitoring snapshot refresh.',
    unit: 's'
  }
);
const monitoringSnapshotSuccessGauge = meter.createObservableGauge(
  'platform_monitoring_snapshot_success',
  {
    description: 'Whether the last background monitoring snapshot refresh succeeded.'
  }
);
const processStartedGauge = meter.createObservableGauge(
  'platform_process_started_timestamp_seconds',
  {
    description: 'Unix timestamp when the API monitoring process started.',
    unit: 's'
  }
);
const metricsObservedTimestampGauge = meter.createObservableGauge(
  'platform_metrics_observed_timestamp_seconds',
  {
    description: 'Unix timestamp when metrics were last observed for export.',
    unit: 's'
  }
);
const buildInfoGauge = meter.createObservableGauge('platform_build_info', {
  description: 'Static build metadata for the running service instance.'
});

const workflowStartTimes = new Map<string, number>();
const buildVersion =
  process.env.APP_VERSION?.trim() ||
  process.env.IMAGE_TAG?.trim() ||
  process.env.npm_package_version?.trim() ||
  'dev';
const buildCommitSha =
  process.env.GITHUB_SHA?.trim() ||
  process.env.COMMIT_SHA?.trim() ||
  process.env.SOURCE_VERSION?.trim() ||
  'unknown';

function getWorkflowKey(input: {
  correlationId: string;
  workflowId?: string;
}) {
  return `${input.correlationId}:${input.workflowId ?? 'unknown'}`;
}

function pruneExpiredSessionActivity(now = Date.now()) {
  const cutoff = now - SESSION_ACTIVITY_WINDOW_MS;

  for (const [sessionKey, session] of activeSessions.entries()) {
    if (session.lastSeenAt < cutoff) {
      activeSessions.delete(sessionKey);
    }
  }

  for (const [userKey, user] of activeUsers.entries()) {
    if (user.lastSeenAt < cutoff) {
      activeUsers.delete(userKey);
    }
  }
}

async function refreshMonitoringSnapshot() {
  if (snapshotRefreshInFlight) {
    return snapshotRefreshInFlight;
  }

  snapshotRefreshInFlight = (async () => {
    try {
      const now = new Date();
      const [
        activeTenantCount,
        inactiveTenantCount,
        onboardingTenantCount,
        activeUserCount,
        inactiveUserCount,
        activePreviewSessions,
        activePortalAuthHandoffs,
        jobCounts,
        oldestPendingJob
      ] = await Promise.all([
        prisma.tenant.count({
          where: {
            status: 'ACTIVE'
          }
        }),
        prisma.tenant.count({
          where: {
            status: 'INACTIVE'
          }
        }),
        prisma.tenant.count({
          where: {
            status: 'ONBOARDING'
          }
        }),
        prisma.user.count({
          where: {
            isActive: true
          }
        }),
        prisma.user.count({
          where: {
            isActive: false
          }
        }),
        prisma.previewSession.count({
          where: {
            endedAt: null,
            expiresAt: {
              gt: now
            }
          }
        }),
        prisma.portalAuthHandoff.count({
          where: {
            consumedAt: null,
            expiresAt: {
              gt: now
            }
          }
        }),
        prisma.job.groupBy({
          by: ['status'],
          _count: {
            _all: true
          }
        }),
        prisma.job.findFirst({
          where: {
            status: 'PENDING',
            runAt: {
              lte: now
            }
          },
          orderBy: [{ runAt: 'asc' }, { createdAt: 'asc' }],
          select: {
            createdAt: true,
            runAt: true
          }
        })
      ]);

      const countsByStatus: MonitoringSnapshot['jobCounts'] = {
        FAILED: 0,
        PENDING: 0,
        RUNNING: 0,
        SUCCEEDED: 0
      };

      for (const entry of jobCounts) {
        if (entry.status in countsByStatus) {
          countsByStatus[entry.status as keyof MonitoringSnapshot['jobCounts']] =
            entry._count._all;
        }
      }

      monitoringSnapshot.activeTenantCounts = {
        active: activeTenantCount,
        inactive: inactiveTenantCount,
        onboarding: onboardingTenantCount,
        total: activeTenantCount + inactiveTenantCount + onboardingTenantCount
      };
      monitoringSnapshot.activeUserCounts = {
        active: activeUserCount,
        inactive: inactiveUserCount,
        total: activeUserCount + inactiveUserCount
      };
      monitoringSnapshot.activePortalAuthHandoffs = activePortalAuthHandoffs;
      monitoringSnapshot.activePreviewSessions = activePreviewSessions;
      monitoringSnapshot.jobCounts = countsByStatus;
      monitoringSnapshot.oldestPendingJobAgeSeconds = oldestPendingJob
        ? Math.max(
            0,
            Math.floor((Date.now() - oldestPendingJob.runAt.getTime()) / 1000)
          )
        : 0;
      monitoringSnapshot.refreshedAtSeconds = Math.floor(Date.now() / 1000);
      monitoringSnapshot.refreshSucceeded = true;
    } catch {
      monitoringSnapshot.refreshSucceeded = false;
    } finally {
      snapshotRefreshInFlight = null;
    }
  })();

  return snapshotRefreshInFlight;
}

function startSnapshotRefreshLoop() {
  if (snapshotRefreshStarted) {
    return;
  }

  snapshotRefreshStarted = true;
  void refreshMonitoringSnapshot();

  const interval = setInterval(() => {
    void refreshMonitoringSnapshot();
  }, SNAPSHOT_REFRESH_INTERVAL_MS);
  interval.unref?.();
}

activeSessionGauge.addCallback((observableResult) => {
  pruneExpiredSessionActivity();

  const counts = new Map<string, number>();
  for (const session of activeSessions.values()) {
    counts.set(session.sessionType, (counts.get(session.sessionType) ?? 0) + 1);
  }

  for (const [sessionType, count] of counts.entries()) {
    observableResult.observe(count, {
      session_type: sessionType
    });
  }

  observableResult.observe(activeSessions.size, {
    session_type: 'all'
  });
});

activeUserGauge.addCallback((observableResult) => {
  pruneExpiredSessionActivity();

  const counts = new Map<string, number>();
  for (const user of activeUsers.values()) {
    counts.set(user.sessionType, (counts.get(user.sessionType) ?? 0) + 1);
  }

  for (const [sessionType, count] of counts.entries()) {
    observableResult.observe(count, {
      session_type: sessionType
    });
  }

  observableResult.observe(activeUsers.size, {
    session_type: 'all'
  });
});

jobQueueDepthGauge.addCallback((observableResult) => {
  for (const [status, count] of Object.entries(monitoringSnapshot.jobCounts)) {
    observableResult.observe(count, {
      status
    });
  }
});

oldestPendingJobAgeGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.oldestPendingJobAgeSeconds);
});

tenantTotalGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.activeTenantCounts.total, {
    status: 'all'
  });
  observableResult.observe(monitoringSnapshot.activeTenantCounts.active, {
    status: 'active'
  });
  observableResult.observe(monitoringSnapshot.activeTenantCounts.inactive, {
    status: 'inactive'
  });
  observableResult.observe(monitoringSnapshot.activeTenantCounts.onboarding, {
    status: 'onboarding'
  });
});

userTotalGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.activeUserCounts.total, {
    state: 'all'
  });
  observableResult.observe(monitoringSnapshot.activeUserCounts.active, {
    state: 'active'
  });
  observableResult.observe(monitoringSnapshot.activeUserCounts.inactive, {
    state: 'inactive'
  });
});

previewSessionGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.activePreviewSessions);
});

portalAuthHandoffGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.activePortalAuthHandoffs);
});

monitoringSnapshotTimestampGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.refreshedAtSeconds);
});

monitoringSnapshotSuccessGauge.addCallback((observableResult) => {
  observableResult.observe(monitoringSnapshot.refreshSucceeded ? 1 : 0);
});

processStartedGauge.addCallback((observableResult) => {
  observableResult.observe(processStartedAtSeconds);
});

metricsObservedTimestampGauge.addCallback((observableResult) => {
  observableResult.observe(Math.floor(Date.now() / 1000));
});

buildInfoGauge.addCallback((observableResult) => {
  observableResult.observe(1, {
    commit_sha: buildCommitSha,
    version: buildVersion
  });
});

function registerEventMetrics() {
  if (subscriptionsRegistered) {
    return;
  }

  subscriptionsRegistered = true;

  subscribe(
    'workflow.started',
    async (event) => {
      workflowStartTimes.set(
        getWorkflowKey({
          correlationId: event.correlationId,
          workflowId: event.payload.workflowId
        }),
        event.timestamp.getTime()
      );
    },
    {
      subscriberId: 'monitoring.workflow.started'
    }
  );

  subscribe(
    'workflow.completed',
    async (event) => {
      const key = getWorkflowKey({
        correlationId: event.correlationId,
        workflowId: event.payload.workflowId
      });
      const startedAt = workflowStartTimes.get(key);

      if (!startedAt) {
        return;
      }

      workflowStartTimes.delete(key);
      workflowDurationHistogram.record(event.timestamp.getTime() - startedAt, {
        status: event.payload.status,
        workflow_type: event.payload.workflowType
      });
    },
    {
      subscriberId: 'monitoring.workflow.completed'
    }
  );

  subscribe(
    'notification.sent',
    async (event) => {
      notificationThroughputCounter.add(1, {
        channel: event.payload.channel
      });
    },
    {
      subscriberId: 'monitoring.notification.sent'
    }
  );
}

export function initializeMonitoring(options: { subscribeToEvents?: boolean } = {}) {
  if (initialized) {
    if (options.subscribeToEvents) {
      registerEventMetrics();
    }
    startSnapshotRefreshLoop();
    return;
  }

  initialized = true;
  startSnapshotRefreshLoop();

  if (options.subscribeToEvents) {
    registerEventMetrics();
  }
}

export function recordAuthenticatedSessionActivity(input: {
  sessionType: 'end_user' | 'platform_admin' | 'tenant_admin';
  tenantId: string;
  token: string;
  userId: string;
}) {
  const now = Date.now();
  const sessionKey = createHash('sha1').update(input.token).digest('hex');
  const userKey = `${input.sessionType}:${input.userId}`;

  activeSessions.set(sessionKey, {
    lastSeenAt: now,
    sessionType: input.sessionType,
    tenantId: input.tenantId,
    userId: input.userId
  });
  activeUsers.set(userKey, {
    lastSeenAt: now,
    sessionType: input.sessionType,
    tenantId: input.tenantId
  });
  pruneExpiredSessionActivity(now);
}

export function recordApiRequest(input: {
  durationMs: number;
  method: string;
  route: string;
  statusCode: number;
}) {
  const attributes = {
    method: input.method,
    route: input.route,
    status_code: String(input.statusCode)
  };

  apiRequestCounter.add(1, attributes);
  apiLatencyHistogram.record(input.durationMs, attributes);

  if (input.statusCode >= 400) {
    apiErrorCounter.add(1, attributes);
  }
}

export function recordIntegrationExecution(input: {
  adapterKey: string;
  durationMs: number;
  status: 'FAILED' | 'SUCCEEDED';
  triggerMode: string;
}) {
  const attributes = {
    adapter_key: input.adapterKey,
    status: input.status,
    trigger_mode: input.triggerMode
  };

  integrationActivityCounter.add(1, attributes);
  integrationDurationHistogram.record(input.durationMs, attributes);
}

export function handlePrometheusMetrics(
  request: IncomingMessage,
  response: ServerResponse
) {
  initializeMonitoring();
  exporter.getMetricsRequestHandler(request, response);
}
