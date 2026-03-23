import { prisma } from '@payer-portal/database';
import { listAuditEvents } from '@payer-portal/server';
import type { FastifyInstance } from 'fastify';

import {
  assertPlatformAdmin,
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders,
  resolveTenantScope
} from '../services/current-user-service';

type AuditEventsQuery = {
  tenant_id?: string;
  user_id?: string;
  event_type?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
  page?: string;
  page_size?: string;
};

function parseOptionalDate(value: string | undefined, fieldName: string) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO 8601 date`);
  }

  return parsed;
}

function parseOptionalInteger(value: string | undefined, fieldName: string) {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function handleRouteError(
  error: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
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
      'Local database unavailable. Start PostgreSQL, run migrations.'
  });
}

export async function auditRoutes(app: FastifyInstance) {
  app.get<{ Querystring: AuditEventsQuery }>(
    '/audit/events',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertTenantAdmin(currentUser);

        const tenantId = resolveTenantScope(
          currentUser,
          request.query.tenant_id
        );

        return await listAuditEvents({
          tenantId,
          actorUserId: request.query.user_id,
          eventType: request.query.event_type,
          resourceType: request.query.resource_type,
          dateFrom: parseOptionalDate(request.query.date_from, 'date_from'),
          dateTo: parseOptionalDate(request.query.date_to, 'date_to'),
          page: parseOptionalInteger(request.query.page, 'page'),
          pageSize: parseOptionalInteger(request.query.page_size, 'page_size')
        });
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );

  app.get<{ Querystring: AuditEventsQuery }>(
    '/platform-admin/audit/events',
    async (request, reply) => {
      try {
        const currentUser = await getCurrentUserFromHeaders(request.headers);
        assertPlatformAdmin(currentUser);

        const page = parseOptionalInteger(request.query.page, 'page') ?? 1;
        const pageSize =
          parseOptionalInteger(request.query.page_size, 'page_size') ?? 25;
        const dateFrom = parseOptionalDate(request.query.date_from, 'date_from');
        const dateTo = parseOptionalDate(request.query.date_to, 'date_to');

        if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
          throw new Error('date_from must be before or equal to date_to');
        }

        const where = {
          ...(request.query.tenant_id?.trim()
            ? { tenantId: request.query.tenant_id.trim() }
            : {}),
          ...(request.query.user_id?.trim()
            ? { actorUserId: request.query.user_id.trim() }
            : {}),
          ...(request.query.event_type?.trim()
            ? { action: request.query.event_type.trim() }
            : {}),
          ...(request.query.resource_type?.trim()
            ? { entityType: request.query.resource_type.trim() }
            : {}),
          ...(dateFrom || dateTo
            ? {
                createdAt: {
                  ...(dateFrom ? { gte: dateFrom } : {}),
                  ...(dateTo ? { lte: dateTo } : {})
                }
              }
            : {})
        };

        const [items, totalCount] = await Promise.all([
          prisma.auditLog.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize
          }),
          prisma.auditLog.count({
            where
          })
        ]);

        return {
          items: items.map((item) => ({
            id: item.id,
            tenantId: item.tenantId,
            userId: item.actorUserId,
            eventType: item.action,
            resourceType: item.entityType,
            resourceId: item.entityId,
            beforeState: item.beforeState,
            afterState: item.afterState,
            metadata: item.metadata,
            ipAddress: item.ipAddress,
            userAgent: item.userAgent,
            timestamp: item.createdAt
          })),
          pagination: {
            page,
            pageSize,
            totalCount,
            totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)
          }
        };
      } catch (error) {
        return handleRouteError(error, reply);
      }
    }
  );
}
