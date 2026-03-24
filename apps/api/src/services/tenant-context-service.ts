import type { IncomingHttpHeaders } from 'node:http';

import {
  setTenantContext,
  type TenantRequestContext
} from '@payer-portal/database';

import { verifyAccessToken } from './access-token-service';

export const TENANT_HEADER_NAME = 'x-tenant-id';
export const PLATFORM_TENANT_ID = 'platform';

function readHeaderValue(
  headers: IncomingHttpHeaders,
  name: string
) {
  const value = headers[name];

  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getBearerToken(headers: IncomingHttpHeaders) {
  const authorization = readHeaderValue(headers, 'authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token.trim();
}

export function resolveOptionalTenantContext(
  headers: IncomingHttpHeaders
): TenantRequestContext | null {
  const tenantIdFromHeader = readHeaderValue(headers, TENANT_HEADER_NAME);
  const tokenPayload = verifyAccessToken(getBearerToken(headers));
  const tenantIdFromToken = tokenPayload?.tenantId?.trim() || null;
  const tenantId = tenantIdFromHeader ?? tenantIdFromToken;

  if (!tenantId) {
    return null;
  }

  if (
    tenantIdFromHeader &&
    tenantIdFromToken &&
    tenantIdFromToken !== PLATFORM_TENANT_ID &&
    tenantIdFromHeader !== tenantIdFromToken
  ) {
    throw new Error(
      'Tenant context mismatch. x-tenant-id must match the authenticated tenant scope.'
    );
  }

  return {
    tenantId,
    source: tenantIdFromHeader ? 'header' : 'token'
  };
}

export function requireTenantContext(headers: IncomingHttpHeaders) {
  const context = resolveOptionalTenantContext(headers);

  if (!context) {
    throw new Error(
      'Tenant context required. Provide x-tenant-id or a tenant-scoped bearer token.'
    );
  }

  setTenantContext(context);
  return context;
}
