import { clearTenantContext } from '@payer-portal/database';

import { registerBillingEnrollmentAdapters } from '../modules/billingEnrollment/index.js';
import { initializeMonitoring } from '../monitoring/telemetry.js';
import { registerIntegrationEventSubscriptions } from '../integrations/subscriptions.js';
import { createStructuredLogger } from '../observability/logger.js';
import { logAuditEvent } from '../services/auditService.js';
import { registerJobEventSubscriptions } from './jobSubscriptions.js';
import {
  getPendingJob,
  getPendingJobForTenant,
  markJobFailedOrRetry,
  markJobRunning,
  markJobSucceeded
} from './jobQueue.js';
import { getJobHandler, registerDefaultJobHandlers } from './jobRegistry.js';
import { jobWorkerRuntimeConfig } from './runtime-config.js';
import { JOB_STATUS } from './jobTypes.js';

export type JobWorkerOptions = {
  pollIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

let workerRuntimeInitialized = false;

function initializeWorkerRuntime() {
  if (workerRuntimeInitialized) {
    return;
  }

  workerRuntimeInitialized = true;
  initializeMonitoring({
    subscribeToEvents: true
  });
  registerBillingEnrollmentAdapters();
  registerJobEventSubscriptions();
  registerIntegrationEventSubscriptions();
}

export async function runNextJob(options: { tenantId?: string } = {}) {
  clearTenantContext();
  initializeWorkerRuntime();
  registerDefaultJobHandlers();
  const logger = createStructuredLogger({
    observability: {
      capabilityId: 'platform.jobs',
      failureType: 'none',
      tenantId: options.tenantId ?? 'platform'
    },
    serviceName: jobWorkerRuntimeConfig.observability.serviceName
  });

  const pendingJob = options.tenantId
    ? await getPendingJobForTenant(options.tenantId)
    : await getPendingJob();

  if (!pendingJob) {
    return false;
  }

  const runningJob = await markJobRunning(pendingJob.id);

  if (!runningJob) {
    return false;
  }

  logger.info('picked up job', {
    id: runningJob.id,
    type: runningJob.type,
    attempts: runningJob.attempts,
    maxAttempts: runningJob.maxAttempts,
    tenantId: runningJob.tenantId ?? options.tenantId ?? 'platform'
  });

  const handler = getJobHandler(runningJob.type);

  try {
    if (!handler) {
      throw new Error(`No job handler registered for ${runningJob.type}`);
    }

    await handler({
      payload: runningJob.payload,
      job: runningJob
    });

    await markJobSucceeded(runningJob.id);
    logger.info('job succeeded', {
      id: runningJob.id,
      type: runningJob.type,
      tenantId: runningJob.tenantId ?? options.tenantId ?? 'platform'
    });
  } catch (error) {
    const updatedJob = await markJobFailedOrRetry(runningJob, error);
    logger.error('job failed', {
      id: runningJob.id,
      type: runningJob.type,
      status: updatedJob.status,
      lastError: updatedJob.lastError,
      failureType: 'job',
      tenantId: updatedJob.tenantId ?? options.tenantId ?? 'platform'
    });

    if (updatedJob.status === JOB_STATUS.FAILED && updatedJob.tenantId) {
      await logAuditEvent({
        capabilityId: 'platform.jobs',
        tenantId: updatedJob.tenantId,
        actorUserId: null,
        action: 'job.failed',
        correlationId: logger.correlationId,
        entityType: 'Job',
        entityId: updatedJob.id,
        failureType: 'job',
        metadata: {
          type: updatedJob.type,
          attempts: updatedJob.attempts
        }
      });
    }
  } finally {
    clearTenantContext();
  }

  return true;
}

export function createJobWorker(options: JobWorkerOptions = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const sleep = options.sleep ?? defaultSleep;
  let stopped = false;

  return {
    async start() {
      initializeWorkerRuntime();
      registerDefaultJobHandlers();

      while (!stopped) {
        const processed = await runNextJob();

        if (!processed) {
          await sleep(pollIntervalMs);
        }
      }
    },
    stop() {
      stopped = true;
    }
  };
}
