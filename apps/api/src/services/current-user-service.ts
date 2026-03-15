import type { IncomingHttpHeaders } from 'node:http';

import { prisma } from '@payer-portal/database';

export class AuthenticationError extends Error {
  constructor(message = 'Authenticated user required. Provide x-user-id header.') {
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
  email: string;
  roles: string[];
  permissions: string[];
};

export const PLATFORM_ADMIN_ROLE_CODE = 'platform_admin';
export const TENANT_ADMIN_ROLE_CODE = 'tenant_admin';
const LEGACY_PLATFORM_ADMIN_ROLE_CODE = 'platform-admin';

function getUserIdHeader(headers: IncomingHttpHeaders) {
  const userIdHeader = headers['x-user-id'];

  if (Array.isArray(userIdHeader)) {
    return userIdHeader[0];
  }

  return userIdHeader;
}

export async function getCurrentUserFromHeaders(
  headers: IncomingHttpHeaders
): Promise<CurrentUser> {
  const userId = getUserIdHeader(headers)?.trim();

  if (!userId) {
    throw new AuthenticationError();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
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

  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    roles: user.roles.map(({ role }) => role.code),
    permissions: Array.from(
      new Set(
        user.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code)
        )
      )
    )
  };
}

export function isPlatformAdmin(user: CurrentUser) {
  return (
    user.roles.includes(PLATFORM_ADMIN_ROLE_CODE) ||
    user.roles.includes(LEGACY_PLATFORM_ADMIN_ROLE_CODE)
  );
}

export function isTenantAdmin(user: CurrentUser) {
  return (
    isPlatformAdmin(user) ||
    user.roles.includes(TENANT_ADMIN_ROLE_CODE) ||
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
    return user.tenantId;
  }

  if (normalizedRequestedTenantId === user.tenantId) {
    return normalizedRequestedTenantId;
  }

  if (isPlatformAdmin(user)) {
    return normalizedRequestedTenantId;
  }

  throw new AuthorizationError(
    'You do not have permission to access another tenant.'
  );
}
