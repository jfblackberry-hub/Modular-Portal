import type { AuditLog, Prisma, PrismaClient } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

type AuditLogClient = Pick<PrismaClient, 'auditLog'> | Prisma.TransactionClient;

export type AuditRequestMetadataInput = {
  correlationId?: string | null;
  method?: string | null;
  route?: string | null;
  statusCode?: number | null;
};

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
  beforeState: Prisma.JsonValue | null;
  afterState: Prisma.JsonValue | null;
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
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
  client?: AuditLogClient;
};

export type AuditSinkWriteInput = Omit<LogAuditEventInput, 'client'> & {
  timestamp?: Date | null;
  client?: AuditLogClient;
};

export type AuditLogSink = {
  write: (input: AuditSinkWriteInput) => Promise<AuditLog | void>;
};

type AuditCategoryLogInput = {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  request?: AuditRequestMetadataInput | null;
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

function normalizeOptionalNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

function asObjectRecord(value: Prisma.InputJsonValue | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, Prisma.InputJsonValue>;
}

const SENSITIVE_AUDIT_KEY_PATTERN =
  /(password|secret|token|authorization|cookie|ssn|dob|dateofbirth|member(number|id)?|subscriber(id|number)?|email|phone|address|diagnosis|claim|iban|account(number)?|routing(number)?|npi|tin|ein|taxid|phi|pii)/i;

function isSensitiveAuditKey(key: string) {
  return SENSITIVE_AUDIT_KEY_PATTERN.test(key);
}

function isSensitiveStringValue(value: string) {
  return (
    /^bearer\s+/i.test(value) ||
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(value)
  );
}

function sanitizeAuditJsonValue(
  value: Prisma.InputJsonValue | undefined,
  parentKey?: string
): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  if (
    parentKey &&
    isSensitiveAuditKey(parentKey)
  ) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    return isSensitiveStringValue(value) ? '[REDACTED]' : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeAuditJsonValue(entry) ?? null) as Prisma.InputJsonArray;
  }

  const sanitizedEntries = Object.entries(value).map(([key, entryValue]) => [
    key,
    sanitizeAuditJsonValue(entryValue as Prisma.InputJsonValue, key)
  ]);

  return Object.fromEntries(sanitizedEntries) as Prisma.InputJsonObject;
}

export function buildAuditRequestMetadata(
  input: AuditRequestMetadataInput
): Prisma.InputJsonObject {
  return {
    correlationId: normalizeOptional(input.correlationId) ?? undefined,
    method: normalizeOptional(input.method) ?? undefined,
    route: normalizeOptional(input.route) ?? undefined,
    statusCode: normalizeOptionalNumber(input.statusCode) ?? undefined
  };
}

function buildAuditMetadata(
  metadata: Prisma.InputJsonValue | undefined,
  request: AuditRequestMetadataInput | null | undefined
) {
  const metadataRecord = asObjectRecord(metadata);

  if (!request) {
    return metadataRecord ?? metadata;
  }

  return {
    ...(metadataRecord ?? {}),
    request: buildAuditRequestMetadata(request)
  } satisfies Prisma.InputJsonObject;
}

const databaseAuditLogSink: AuditLogSink = {
  async write(input) {
    return await (input.client ?? prisma).auditLog.create({
      data: {
        tenantId: normalizeRequired(input.tenantId, 'tenantId'),
        actorUserId: normalizeOptional(input.actorUserId),
        action: normalizeRequired(input.action, 'action'),
        entityType: normalizeRequired(input.entityType, 'entityType'),
        entityId: normalizeOptional(input.entityId),
        beforeState: sanitizeAuditJsonValue(input.beforeState),
        afterState: sanitizeAuditJsonValue(input.afterState),
        metadata: sanitizeAuditJsonValue(input.metadata),
        ipAddress: normalizeOptional(input.ipAddress),
        userAgent: normalizeOptional(input.userAgent),
        ...(input.timestamp ? { createdAt: input.timestamp } : {})
      }
    });
  }
};

let auditLogSinks: AuditLogSink[] = [databaseAuditLogSink];

export function registerAuditLogSink(sink: AuditLogSink) {
  auditLogSinks = [...auditLogSinks, sink];
}

export function resetAuditLogSinksForTest() {
  auditLogSinks = [databaseAuditLogSink];
}

export async function logAuditEvent(
  input: LogAuditEventInput
): Promise<AuditLog> {
  try {
    let primaryRecord: AuditLog | null = null;

    for (const sink of auditLogSinks) {
      const sinkRecord = await sink.write(input);
      if (sinkRecord && !primaryRecord) {
        primaryRecord = sinkRecord;
      }
    }

    if (!primaryRecord) {
      throw new AuditLogWriteError();
    }

    return primaryRecord;
  } catch (error) {
    if (
      error instanceof Error &&
      (/is required$/.test(error.message) || error instanceof AuditLogWriteError)
    ) {
      throw error;
    }

    throw new AuditLogWriteError();
  }
}

export async function logAuthenticationEvent(
  input: AuditCategoryLogInput
): Promise<AuditLog> {
  return logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: normalizeRequired(input.resourceType, 'resourceType'),
    entityId: normalizeOptional(input.resourceId),
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: buildAuditMetadata(input.metadata, input.request),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    client: input.client
  });
}

export async function logAuthorizationFailure(
  input: Omit<AuditCategoryLogInput, 'action'>
): Promise<AuditLog> {
  return logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: 'auth.authorization.failed',
    entityType: normalizeRequired(input.resourceType, 'resourceType'),
    entityId: normalizeOptional(input.resourceId),
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: buildAuditMetadata(input.metadata, input.request),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    client: input.client
  });
}

export async function logAdminAction(
  input: AuditCategoryLogInput
): Promise<AuditLog> {
  return logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: normalizeRequired(input.resourceType, 'resourceType'),
    entityId: normalizeOptional(input.resourceId),
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: buildAuditMetadata(input.metadata, input.request),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    client: input.client
  });
}

export async function logPersonaSwitchEvent(
  input: AuditCategoryLogInput
): Promise<AuditLog> {
  return logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: normalizeRequired(input.resourceType, 'resourceType'),
    entityId: normalizeOptional(input.resourceId),
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: buildAuditMetadata(input.metadata, input.request),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    client: input.client
  });
}

export async function logSensitiveDataAccess(
  input: AuditCategoryLogInput
): Promise<AuditLog> {
  return logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: normalizeRequired(input.resourceType, 'resourceType'),
    entityId: normalizeOptional(input.resourceId),
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: buildAuditMetadata(input.metadata, input.request),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    client: input.client
  });
}

export async function logIntegrationEvent(
  input: AuditCategoryLogInput
): Promise<AuditLog> {
  return logAuditEvent({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: normalizeRequired(input.resourceType, 'resourceType'),
    entityId: normalizeOptional(input.resourceId),
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: buildAuditMetadata(input.metadata, input.request),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    client: input.client
  });
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
}
