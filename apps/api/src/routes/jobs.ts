import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@payer-portal/database';

import {
  enqueueJob,
  getJobById,
  listJobs,
  retryFailedJob
} from '@payer-portal/server';
import { prisma } from '@payer-portal/database';
import { logAuditEvent } from '@payer-portal/server';
import {
  assertPlatformAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders
} from '../services/current-user-service';

type CreateJobBody = {
  type: string;
  tenantId?: string | null;
  payload: Prisma.InputJsonValue;
  runAt?: string;
  maxAttempts?: number;
};

type JobQuery = {
  status?: string;
  type?: string;
  tenantId?: string;
};

async function resolveAuditTenant(tenantId?: string | null) {
  if (tenantId) {
    return tenantId;
  }

  const fallbackTenant = await prisma.tenant.findFirst({
    select: { id: true }
  });

  return fallbackTenant?.id ?? null;
}

export async function jobRoutes(app: FastifyInstance) {
  app.get<{ Querystring: JobQuery }>('/api/jobs', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      return await listJobs(request.query);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const job = await getJobById(request.params.id);

      if (!job) {
        return reply.status(404).send({
          message: 'Job not found'
        });
      }

      return job;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.post<{ Body: CreateJobBody }>('/api/jobs', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const job = await enqueueJob({
        type: request.body.type,
        tenantId: request.body.tenantId ?? null,
        payload: request.body.payload,
        runAt: request.body.runAt ? new Date(request.body.runAt) : undefined,
        maxAttempts: request.body.maxAttempts
      });

      const auditTenantId = await resolveAuditTenant(job.tenantId);

      if (auditTenantId) {
        await logAuditEvent({
          tenantId: auditTenantId,
          actorUserId: currentUser.id,
          action: 'job.enqueued',
          entityType: 'Job',
          entityId: job.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: {
            type: job.type,
            tenantId: job.tenantId
          }
        });
      }

      return reply.status(201).send(job);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      if (error instanceof Error) {
        return reply.status(400).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });

  app.post<{ Params: { id: string } }>('/api/jobs/:id/retry', async (request, reply) => {
    try {
      const currentUser = await getCurrentUserFromHeaders(request.headers);
      assertPlatformAdmin(currentUser);

      const job = await retryFailedJob(request.params.id);

      const auditTenantId = await resolveAuditTenant(job.tenantId);

      if (auditTenantId) {
        await logAuditEvent({
          tenantId: auditTenantId,
          actorUserId: currentUser.id,
          action: 'job.retried',
          entityType: 'Job',
          entityId: job.id,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          metadata: {
            type: job.type,
            tenantId: job.tenantId
          }
        });
      }

      return reply.send(job);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return reply.status(401).send({ message: error.message });
      }

      if (error instanceof AuthorizationError) {
        return reply.status(403).send({ message: error.message });
      }

      if (error instanceof Error) {
        const status = error.message === 'Job not found' ? 404 : 400;
        return reply.status(status).send({ message: error.message });
      }

      return reply.status(503).send({
        message:
          'Local database unavailable. Start PostgreSQL, run migrations, and seed data.'
      });
    }
  });
}
