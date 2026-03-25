import { prisma } from '@payer-portal/database';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  assertTenantAdmin,
  AuthenticationError,
  AuthorizationError,
  getCurrentUserFromHeaders,
  PLATFORM_ROOT_SCOPE,
  type CurrentUser
} from './current-user-service';

type TenantAccessContext = {
  currentUser: CurrentUser;
  tenantId: string;
  orgUnitId: string | null;
};

declare module 'fastify' {
  interface FastifyRequest {
    tenantAccessContext?: TenantAccessContext;
  }
}

const FORBIDDEN_TENANT_KEYS = new Set(['tenantId', 'tenant_id']);
const ORG_UNIT_KEYS = new Set(['orgUnitId', 'org_unit_id']);

export class TenantAccessMiddlewareError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'TenantAccessMiddlewareError';
    this.statusCode = statusCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findFirstValue(
  value: unknown,
  matcher: (key: string, rawValue: unknown) => boolean
): unknown {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = findFirstValue(entry, matcher);
      if (nested !== undefined) {
        return nested;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (matcher(key, entry)) {
      return entry;
    }

    const nested = findFirstValue(entry, matcher);
    if (nested !== undefined) {
      return nested;
    }
  }

  return undefined;
}

function containsTenantIdentifier(value: unknown) {
  return (
    findFirstValue(
      value,
      (key, entry) => FORBIDDEN_TENANT_KEYS.has(key) && entry !== undefined
    ) !== undefined
  );
}

function readOrgUnitIdFromRequest(request: FastifyRequest) {
  const value =
    findFirstValue(
      request.body,
      (key, entry) => ORG_UNIT_KEYS.has(key) && typeof entry === 'string'
    ) ??
    findFirstValue(
      request.query,
      (key, entry) => ORG_UNIT_KEYS.has(key) && typeof entry === 'string'
    ) ??
    findFirstValue(
      request.params,
      (key, entry) => ORG_UNIT_KEYS.has(key) && typeof entry === 'string'
    );

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function enforceTenantAccess(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const currentUser = await getCurrentUserFromHeaders(request.headers);
  const tenantId = currentUser.tenantId;

  if (tenantId === PLATFORM_ROOT_SCOPE) {
    throw new TenantAccessMiddlewareError(
      403,
      'Tenant-scoped routes require a tenant-scoped authenticated session.'
    );
  }

  if (
    containsTenantIdentifier(request.query) ||
    containsTenantIdentifier(request.body)
  ) {
    throw new TenantAccessMiddlewareError(
      400,
      'Client-supplied tenantId is not allowed. Tenant scope is resolved from the authenticated session.'
    );
  }

  const orgUnitId = readOrgUnitIdFromRequest(request);

  if (orgUnitId) {
    const orgUnit = await prisma.organizationUnit.findFirst({
      where: {
        id: orgUnitId,
        tenantId
      },
      select: {
        id: true
      }
    });

    if (!orgUnit) {
      throw new TenantAccessMiddlewareError(
        403,
        'The requested organization unit is not accessible in the authenticated tenant scope.'
      );
    }
  }

  request.tenantAccessContext = {
    currentUser,
    tenantId,
    orgUnitId
  };
}

export function getTenantAccessContext(request: FastifyRequest) {
  if (!request.tenantAccessContext) {
    throw new TenantAccessMiddlewareError(
      500,
      'Tenant access middleware did not run for this route.'
    );
  }

  return request.tenantAccessContext;
}

export function handleTenantAccessError(
  error: unknown,
  reply: { status: (code: number) => { send: (body: unknown) => unknown } }
) {
  if (error instanceof TenantAccessMiddlewareError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  if (error instanceof AuthenticationError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof AuthorizationError) {
    return reply.status(403).send({ message: error.message });
  }

  return null;
}
