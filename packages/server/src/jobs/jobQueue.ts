import type { Job, Prisma, PrismaClient } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import {
  DEFAULT_JOB_MAX_ATTEMPTS,
  type EnqueueJobInput,
  JOB_STATUS,
  type JobRecord,
  type JobStatus
} from './jobTypes.js';

type JobDelegateClient = {
  job: PrismaClient['job'];
};

type JobFilters = {
  status?: string;
  type?: string;
  tenantId?: string;
};

function getClient(client?: JobDelegateClient) {
  return client ?? prisma;
}

function mapJob(job: Job): JobRecord {
  return {
    ...job,
    payload: job.payload as Prisma.JsonValue
  };
}

function normalizeRunAt(runAt?: Date) {
  return runAt ?? new Date();
}

function normalizeMaxAttempts(maxAttempts?: number) {
  return maxAttempts && maxAttempts > 0
    ? Math.floor(maxAttempts)
    : DEFAULT_JOB_MAX_ATTEMPTS;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return 'Unknown job error';
}

export async function enqueueJob(
  input: EnqueueJobInput,
  client?: JobDelegateClient
) {
  const job = await getClient(client).job.create({
    data: {
      type: input.type.trim(),
      tenantId: input.tenantId ?? null,
      payload: input.payload as Prisma.InputJsonValue,
      status: JOB_STATUS.PENDING,
      runAt: normalizeRunAt(input.runAt),
      maxAttempts: normalizeMaxAttempts(input.maxAttempts)
    }
  });

  return mapJob(job);
}

export async function getPendingJob(client?: JobDelegateClient) {
  const job = await getClient(client).job.findFirst({
    where: {
      status: JOB_STATUS.PENDING,
      runAt: {
        lte: new Date()
      }
    },
    orderBy: [{ runAt: 'asc' }, { createdAt: 'asc' }]
  });

  return job ? mapJob(job) : null;
}

export async function markJobRunning(jobId: string) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.job.updateMany({
      where: {
        id: jobId,
        status: JOB_STATUS.PENDING
      },
      data: {
        status: JOB_STATUS.RUNNING,
        attempts: {
          increment: 1
        }
      }
    });

    if (result.count === 0) {
      return null;
    }

    const job = await tx.job.findUnique({
      where: { id: jobId }
    });

    return job ? mapJob(job) : null;
  });
}

export async function markJobSucceeded(jobId: string, client?: JobDelegateClient) {
  const job = await getClient(client).job.update({
    where: { id: jobId },
    data: {
      status: JOB_STATUS.SUCCEEDED,
      lastError: null
    }
  });

  return mapJob(job);
}

export async function markJobFailedOrRetry(
  job: Pick<Job, 'id' | 'attempts' | 'maxAttempts'>,
  error: unknown,
  client?: JobDelegateClient
) {
  const lastError = normalizeError(error);
  const shouldRetry = job.attempts < job.maxAttempts;
  const nextStatus: JobStatus = shouldRetry ? JOB_STATUS.PENDING : JOB_STATUS.FAILED;
  const runAt = shouldRetry
    ? new Date(Date.now() + job.attempts * 60_000)
    : undefined;

  const updatedJob = await getClient(client).job.update({
    where: { id: job.id },
    data: {
      status: nextStatus,
      lastError,
      runAt
    }
  });

  return mapJob(updatedJob);
}

export async function listJobs(filters: JobFilters = {}, client?: JobDelegateClient) {
  const jobs = await getClient(client).job.findMany({
    where: {
      status: filters.status,
      type: filters.type,
      tenantId: filters.tenantId
    },
    orderBy: [{ createdAt: 'desc' }, { runAt: 'asc' }]
  });

  return jobs.map(mapJob);
}

export async function getJobById(id: string, client?: JobDelegateClient) {
  const job = await getClient(client).job.findUnique({
    where: { id }
  });

  return job ? mapJob(job) : null;
}

export async function retryFailedJob(id: string, client?: JobDelegateClient) {
  const db = getClient(client);
  const job = await db.job.findUnique({
    where: { id }
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== JOB_STATUS.FAILED) {
    throw new Error('Only failed jobs can be retried');
  }

  const updatedJob = await db.job.update({
    where: { id },
    data: {
      status: JOB_STATUS.PENDING,
      lastError: null,
      runAt: new Date(),
      attempts: 0
    }
  });

  return mapJob(updatedJob);
}
