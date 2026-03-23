import type { IncomingHttpHeaders } from 'node:http';

import { prisma, setTenantContext } from '@payer-portal/database';

import { verifyAccessToken } from './access-token-service';
import {
  PLATFORM_TENANT_ID,
  requireTenantContext
} from './tenant-context-service';

export class AuthenticationError extends Error {
  constructor(message = 'Authenticated user required. Provide bearer token.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export type CurrentUser = {
  id: string;
  tenantId: string;
  sessionType: 'tenant_admin' | 'end_user' | 'platform_admin';
  employerGroupId?: string | null;
  email: string;
  roles: string[];
  permissions: string[];
  accessibleTenantIds: string[];
  tenantAdminTenantIds: string[];
  previewSessionId?: string;
  previewMode?: 'READ_ONLY' | 'FUNCTIONAL';
};

export const PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
export const TENANT_ADMIN_ROLE_CODE = 'tenant_admin';
const LEGACY_PLATFORM_ADMIN_ROLE_CODE = 'platform-admin';
export const PLATFORM_ROOT_SCOPE = PLATFORM_TENANT_ID;

function getAuthorizationHeader(headers: IncomingHttpHeaders) {
  const authorizationHeader = headers.authorization;
  if (Array.isArray(authorizationHeader)) {
    return authorizationHeader[0];
  }
  return authorizationHeader;
}

function getBearerToken(headers: IncomingHttpHeaders) {
  const authorizationHeader = getAuthorizationHeader(headers)?.trim();
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(/\s+/, 2);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token.trim();
}

export async function getCurrentUserFromHeaders(
  headers: IncomingHttpHeaders
): Promise<CurrentUser> {
  const bearerToken = getBearerToken(headers);
  if (!bearerToken) {
    throw new AuthenticationError();
  }
  const tokenPayload = verifyAccessToken(bearerToken);
  if (!tokenPayload) {
    throw new AuthenticationError('Invalid or expired access token.');
  }

  let requestTenantContext;

  try {
    requestTenantContext = requireTenantContext(headers);
  } catch (error) {
    throw new AuthenticationError(
      error instanceof Error ? error.message : 'Tenant context required.'
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.sub },
    include: {
      memberships: {
        select: {
          tenantId: true,
          isDefault: true,
          isTenantAdmin: true
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
      },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new AuthenticationError('Authenticated user not found.');
  }
  if (user.email !== tokenPayload.email) {
    throw new AuthenticationError('Access token subject mismatch.');
  }

  const accessibleTenantIds = Array.from(
    new Set([
      ...(user.tenantId ? [user.tenantId] : []),
      ...user.memberships.map((membership) => membership.tenantId)
    ])
  );

  if (
    tokenPayload.tenantId !== PLATFORM_ROOT_SCOPE &&
    !accessibleTenantIds.includes(tokenPayload.tenantId)
  ) {
    throw new AuthenticationError('Access token tenant scope mismatch.');
  }

  const roleCodes = user.roles.map(({ role }) => role.code);
  const permissionCodes = Array.from(
    new Set(
      user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code)
      )
    )
  );
  const tenantAdminTenantIds = Array.from(
    new Set([
      ...user.memberships
        .filter((membership) => membership.isTenantAdmin)
        .map((membership) => membership.tenantId),
      ...(roleCodes.includes(TENANT_ADMIN_ROLE_CODE) && user.tenantId
        ? [user.tenantId]
        : [])
    ])
  );

  if (
    tokenPayload.sessionType === 'platform_admin' &&
    !roleCodes.includes(PLATFORM_ADMIN_ROLE_CODE) &&
    !roleCodes.includes(LEGACY_PLATFORM_ADMIN_ROLE_CODE)
  ) {
    throw new AuthenticationError('Access token session type mismatch.');
  }

  if (
    tokenPayload.sessionType === 'tenant_admin' &&
    (tokenPayload.tenantId === PLATFORM_ROOT_SCOPE ||
      (!tenantAdminTenantIds.includes(tokenPayload.tenantId) &&
        !permissionCodes.includes('admin.manage') &&
        !accessibleTenantIds.includes(tokenPayload.tenantId)))
  ) {
    throw new AuthenticationError('Tenant admin session requires a valid tenant scope.');
  }

  if (
    requestTenantContext.tenantId !== PLATFORM_ROOT_SCOPE &&
    !isPlatformAdminRoleSet(roleCodes) &&
    requestTenantContext.tenantId !== tokenPayload.tenantId
  ) {
    throw new AuthenticationError('Tenant context mismatch for authenticated user.');
  }

  if (
    requestTenantContext.tenantId !== PLATFORM_ROOT_SCOPE &&
    isPlatformAdminRoleSet(roleCodes) === false &&
    !accessibleTenantIds.includes(requestTenantContext.tenantId)
  ) {
    throw new AuthenticationError('Access token tenant scope mismatch.');
  }

  return {
    id: user.id,
    tenantId: requestTenantContext.tenantId,
    sessionType: tokenPayload.sessionType,
    employerGroupId: user.employerGroupId,
    email: user.email,
    roles: roleCodes,
    permissions: permissionCodes,
    accessibleTenantIds,
    tenantAdminTenantIds,
    previewSessionId: tokenPayload.previewSessionId,
    previewMode: tokenPayload.previewMode
  };
}

export async function getCurrentUserFromGatewayClaims(claims: {
  sub: string;
  email: string;
  tenantId: string;
}) {
  setTenantContext({
    tenantId: claims.tenantId,
    source: 'token'
  });

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: {
      memberships: {
        select: {
          tenantId: true,
          isTenantAdmin: true
        }
      },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new AuthenticationError('Authenticated user not found.');
  }

  if (user.email !== claims.email) {
    throw new AuthenticationError('Access token subject mismatch.');
  }

  const roleCodes = user.roles.map(({ role }) => role.code);
  const permissionCodes = Array.from(
    new Set(
      user.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code)
      )
    )
  );
  const accessibleTenantIds = Array.from(
    new Set([
      ...(user.tenantId ? [user.tenantId] : []),
      ...user.memberships.map((membership) => membership.tenantId)
    ])
  );
  const tenantAdminTenantIds = Array.from(
    new Set([
      ...user.memberships
        .filter((membership) => membership.isTenantAdmin)
        .map((membership) => membership.tenantId),
      ...(roleCodes.includes(TENANT_ADMIN_ROLE_CODE) && user.tenantId
        ? [user.tenantId]
        : [])
    ])
  );

  if (
    claims.tenantId !== PLATFORM_ROOT_SCOPE &&
    !accessibleTenantIds.includes(claims.tenantId)
  ) {
    throw new AuthenticationError('Access token tenant scope mismatch.');
  }

  if (
    claims.tenantId === PLATFORM_ROOT_SCOPE &&
    !isPlatformAdminRoleSet(roleCodes)
  ) {
    throw new AuthenticationError('Platform tenant scope requires platform admin access.');
  }

  return {
    id: user.id,
    tenantId: claims.tenantId,
    sessionType: isPlatformAdminRoleSet(roleCodes)
      ? 'platform_admin'
      : tenantAdminTenantIds.includes(claims.tenantId)
        ? 'tenant_admin'
        : 'end_user',
    employerGroupId: user.employerGroupId,
    email: user.email,
    roles: roleCodes,
    permissions: permissionCodes,
    accessibleTenantIds,
    tenantAdminTenantIds
  } satisfies CurrentUser;
}

function isPlatformAdminRoleSet(roleCodes: string[]) {
  return (
    roleCodes.includes(PLATFORM_ADMIN_ROLE_CODE) ||
    roleCodes.includes(LEGACY_PLATFORM_ADMIN_ROLE_CODE)
  );
}

export function isPlatformAdmin(user: CurrentUser) {
  return user.sessionType === 'platform_admin' && isPlatformAdminRoleSet(user.roles);
}

export function isTenantAdmin(user: CurrentUser) {
  if (user.sessionType !== 'tenant_admin' && user.sessionType !== 'platform_admin') {
    return false;
  }

  return (
    isPlatformAdmin(user) ||
    user.tenantAdminTenantIds.length > 0 ||
    user.permissions.includes('admin.manage')
  );
}

export function assertTenantAdmin(user: CurrentUser) {
  if (!isTenantAdmin(user)) {
    throw new AuthorizationError();
  }
}

export function assertPlatformAdmin(user: CurrentUser) {
  if (!isPlatformAdmin(user)) {
    throw new AuthorizationError(
      'Platform administrator access is required for this action.'
    );
  }
}

export function resolveTenantScope(
  user: CurrentUser,
  requestedTenantId?: string | null
) {
  const normalizedRequestedTenantId = requestedTenantId?.trim();

  if (!normalizedRequestedTenantId) {
    if (user.tenantId !== PLATFORM_ROOT_SCOPE) {
      return user.tenantId;
    }

    if (isPlatformAdmin(user)) {
      throw new AuthorizationError('Select a tenant workspace for this action.');
    }

    throw new AuthorizationError('No tenant workspace is available for this user.');
  }

  if (normalizedRequestedTenantId === user.tenantId) {
    return normalizedRequestedTenantId;
  }

  if (user.tenantId === PLATFORM_ROOT_SCOPE && isPlatformAdmin(user)) {
    return normalizedRequestedTenantId;
  }

  throw new AuthorizationError(
    'You do not have permission to access another tenant.'
  );
}

export function assertTenantMatch(
  user: CurrentUser,
  resourceTenantId: string,
  context: {
    action?: string;
    requestedTenantId?: string;
  } = {}
) {
  if (
    resourceTenantId === user.tenantId ||
    (user.tenantId === PLATFORM_ROOT_SCOPE && isPlatformAdmin(user))
  ) {
    return;
  }

  const actionSuffix = context.action ? ` for ${context.action}` : '';
  throw new AuthorizationError(
    `Tenant scope mismatch${actionSuffix}. Authenticated tenant cannot access requested resource tenant.`
  );
}
