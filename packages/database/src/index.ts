import { AsyncLocalStorage } from 'node:async_hooks';

import { PrismaClient } from '@prisma/client';

export type TenantRequestContext = {
  tenantId: string;
  source: 'header' | 'token';
};

export class TenantContextError extends Error {
  constructor(message = 'Tenant context mismatch.') {
    super(message);
    this.name = 'TenantContextError';
  }
}

const tenantContextStorage = new AsyncLocalStorage<
  TenantRequestContext | undefined
>();
const TENANT_SCOPED_MODELS = new Set([
  'TenantBranding',
  'EmployerGroup',
  'OrganizationUnit',
  'Notification',
  'ConnectorConfig',
  'IntegrationExecution',
  'Document',
  'Job',
  'AuditLog',
  'FeatureFlag',
  'EventRecord',
  'PreviewSession',
  'PortalAuthHandoff'
]);
const UNSAFE_SINGLE_RECORD_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'update',
  'delete'
]);

declare global {
  var __payerPortalPrisma__: PrismaClient | undefined;
}

function mergeTenantWhere(where: unknown, tenantId: string) {
  if (!where || typeof where !== 'object' || Array.isArray(where)) {
    return { tenantId };
  }

  return {
    AND: [where, { tenantId }]
  };
}

function withTenantWhere(args: unknown, tenantId: string) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return args;
  }

  const record = args as Record<string, unknown>;

  return {
    ...record,
    where: mergeTenantWhere(record.where, tenantId)
  };
}

function enforceTenantData(data: unknown, tenantId: string): unknown {
  if (Array.isArray(data)) {
    return data.map((entry) => enforceTenantData(entry, tenantId));
  }

  if (!data || typeof data !== 'object') {
    return data;
  }

  const record = data as Record<string, unknown>;
  const existingTenantId =
    typeof record.tenantId === 'string' ? record.tenantId.trim() : undefined;

  if (existingTenantId && existingTenantId !== tenantId) {
    throw new TenantContextError(
      'Tenant context mismatch. Query attempted to write a different tenant_id.'
    );
  }

  return {
    ...record,
    tenantId
  };
}

function shouldApplyTenantContext(model: string | undefined) {
  const context = tenantContextStorage.getStore();
  return Boolean(
    model &&
    context &&
    context.tenantId !== 'platform' &&
    TENANT_SCOPED_MODELS.has(model)
  );
}

export function runWithTenantContext<T>(
  context: TenantRequestContext,
  callback: () => T
) {
  return tenantContextStorage.run(context, callback);
}

export function setTenantContext(context: TenantRequestContext) {
  tenantContextStorage.enterWith(context);
}

export function getTenantContext() {
  return tenantContextStorage.getStore() ?? null;
}

export function clearTenantContext() {
  tenantContextStorage.enterWith(undefined);
}

function assertSafeTenantOperation(model: string, operation: string) {
  if (!UNSAFE_SINGLE_RECORD_OPERATIONS.has(operation)) {
    return;
  }

  throw new TenantContextError(
    `Tenant-scoped model ${model} cannot use Prisma ${operation} under an active tenant context. Use tenant-filtered operations such as findFirst, findMany, updateMany, or deleteMany instead.`
  );
}

export function createPrismaClient() {
  const client = new PrismaClient();

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const context = tenantContextStorage.getStore();
          const runQuery = (nextArgs: unknown) => query(nextArgs as never);

          if (!shouldApplyTenantContext(model) || !context) {
            return runQuery(args);
          }

          if (model) {
            assertSafeTenantOperation(model, operation);
          }

          switch (operation) {
            case 'findMany':
            case 'findFirst':
            case 'findFirstOrThrow':
            case 'updateMany':
            case 'deleteMany':
            case 'count':
            case 'aggregate':
            case 'groupBy':
              return runQuery(withTenantWhere(args, context.tenantId));
            case 'create': {
              const record = args as Record<string, unknown>;
              return runQuery({
                ...record,
                data: enforceTenantData(record.data, context.tenantId)
              });
            }
            case 'createMany': {
              const record = args as Record<string, unknown>;
              return runQuery({
                ...record,
                data: enforceTenantData(record.data, context.tenantId)
              });
            }
            case 'upsert': {
              const record = args as Record<string, unknown>;
              return runQuery({
                ...record,
                create: enforceTenantData(record.create, context.tenantId),
                update: enforceTenantData(record.update, context.tenantId)
              });
            }
            default:
              return runQuery(args);
          }
        }
      }
    }
  }) as PrismaClient;
}

export const prisma = globalThis.__payerPortalPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__payerPortalPrisma__ = prisma;
}

export * from '@prisma/client';
export * from './accessModel.js';
export * from './organizationUnits.js';
