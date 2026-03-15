import type { AuditLog, Prisma, PrismaClient } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

type AuditLogClient = Pick<PrismaClient, 'auditLog'> | Prisma.TransactionClient;

export type ListAuditEventsInput = {
  tenantId: string;
  actorUserId?: string | null;
  eventType?: string | null;
  resourceType?: string | null;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  page?: number;
  pageSize?: number;
};

export type AuditEventListItem = {
  id: string;
  tenantId: string;
  userId: string | null;
  eventType: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Prisma.JsonValue | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
};

export type AuditEventListResult = {
  items: AuditEventListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

export type LogAuditEventInput = {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  client?: AuditLogClient;
};

export class AuditLogWriteError extends Error {
  constructor() {
    super('Unable to record audit log event.');
    this.name = 'AuditLogWriteError';
  }
}

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}

function normalizePageSize(value: number | undefined, fallback: number, max: number) {
  return Math.min(normalizePositiveInteger(value, fallback), max);
}

export async function logAuditEvent(
  input: LogAuditEventInput
): Promise<AuditLog> {
  try {
    return await (input.client ?? prisma).auditLog.create({
      data: {
        tenantId: normalizeRequired(input.tenantId, 'tenantId'),
        actorUserId: normalizeOptional(input.actorUserId),
        action: normalizeRequired(input.action, 'action'),
        entityType: normalizeRequired(input.entityType, 'entityType'),
        entityId: normalizeOptional(input.entityId),
        metadata: input.metadata,
        ipAddress: normalizeOptional(input.ipAddress),
        userAgent: normalizeOptional(input.userAgent)
      }
    });
  } catch (error) {
    if (error instanceof Error && /is required$/.test(error.message)) {
      throw error;
    }

    throw new AuditLogWriteError();
  }
}

export async function listAuditEvents(
  input: ListAuditEventsInput
): Promise<AuditEventListResult> {
  const tenantId = normalizeRequired(input.tenantId, 'tenantId');
  const actorUserId = normalizeOptional(input.actorUserId);
  const eventType = normalizeOptional(input.eventType);
  const resourceType = normalizeOptional(input.resourceType);
  const page = normalizePositiveInteger(input.page, 1);
  const pageSize = normalizePageSize(input.pageSize, 25, 100);

  if (
    input.dateFrom &&
    input.dateTo &&
    input.dateFrom.getTime() > input.dateTo.getTime()
  ) {
    throw new Error('dateFrom must be before or equal to dateTo');
  }

  const where: Prisma.AuditLogWhereInput = {
    tenantId,
    ...(actorUserId ? { actorUserId } : {}),
    ...(eventType ? { action: eventType } : {}),
    ...(resourceType ? { entityType: resourceType } : {}),
    ...(input.dateFrom || input.dateTo
      ? {
          createdAt: {
            ...(input.dateFrom ? { gte: input.dateFrom } : {}),
            ...(input.dateTo ? { lte: input.dateTo } : {})
          }
        }
      : {})
  };

  const [items, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [
        {
          createdAt: 'desc'
        },
        {
          id: 'desc'
        }
      ],
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
}
