import { logAuditEvent } from '../services/auditService.js';
import { getJobHandler, registerDefaultJobHandlers } from './jobRegistry.js';
import {
  getPendingJob,
  markJobFailedOrRetry,
  markJobRunning,
  markJobSucceeded
} from './jobQueue.js';
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

export async function runNextJob() {
  registerDefaultJobHandlers();

  const pendingJob = await getPendingJob();

  if (!pendingJob) {
    return false;
  }

  const runningJob = await markJobRunning(pendingJob.id);

  if (!runningJob) {
    return false;
  }

  console.log('[jobs] picked up job', {
    id: runningJob.id,
    type: runningJob.type,
    attempts: runningJob.attempts,
    maxAttempts: runningJob.maxAttempts
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
    console.log('[jobs] job succeeded', {
      id: runningJob.id,
      type: runningJob.type
    });
  } catch (error) {
    const updatedJob = await markJobFailedOrRetry(runningJob, error);
    console.error('[jobs] job failed', {
      id: runningJob.id,
      type: runningJob.type,
      status: updatedJob.status,
      lastError: updatedJob.lastError
    });

    if (updatedJob.status === JOB_STATUS.FAILED && updatedJob.tenantId) {
      await logAuditEvent({
        tenantId: updatedJob.tenantId,
        actorUserId: null,
        action: 'job.failed',
        entityType: 'Job',
        entityId: updatedJob.id,
        metadata: {
          type: updatedJob.type,
          attempts: updatedJob.attempts
        }
      });
    }
  }

  return true;
}

export function createJobWorker(options: JobWorkerOptions = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const sleep = options.sleep ?? defaultSleep;
  let stopped = false;

  return {
    async start() {
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
