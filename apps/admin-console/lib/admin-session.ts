export type AdminSession = {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
};

export function hasAdminConsoleAccess(
  session: Pick<AdminSession, 'isPlatformAdmin' | 'isTenantAdmin'>
) {
  return session.isPlatformAdmin || session.isTenantAdmin;
}

export function createAdminSessionFromAuthUser(user: {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  landingContext?: string | null;
  session?: {
    type?: string | null;
    tenantId?: string | null;
    roles?: string[] | null;
    permissions?: string[] | null;
  } | null;
  tenantId?: string | null;
  tenant?: {
    id?: string;
  };
}): AdminSession | null {
  const sessionRoles = Array.isArray(user.session?.roles) ? user.session.roles : [];
  const sessionPermissions = Array.isArray(user.session?.permissions)
    ? user.session.permissions
    : [];
  const roles = Array.from(
    new Set([
      ...(Array.isArray(user.roles) ? user.roles : []),
      ...sessionRoles
    ])
  );
  const permissions = Array.from(
    new Set([
      ...(Array.isArray(user.permissions) ? user.permissions : []),
      ...sessionPermissions
    ])
  );
  const normalizedLandingContext = user.landingContext?.trim().toLowerCase() ?? '';
  const normalizedSessionType = user.session?.type?.trim().toLowerCase() ?? '';
  const isPlatformAdmin =
    roles.includes('platform_admin') ||
    roles.includes('platform-admin') ||
    normalizedLandingContext === 'platform_admin' ||
    normalizedSessionType === 'platform_admin';
  const isTenantAdmin =
    roles.includes('tenant_admin') ||
    normalizedLandingContext === 'tenant_admin' ||
    normalizedSessionType === 'tenant_admin' ||
    isPlatformAdmin;

  if (!user.id?.trim() || !user.email?.trim() || !hasAdminConsoleAccess({
    isPlatformAdmin,
    isTenantAdmin
  })) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    tenantId:
      user.tenant?.id?.trim() ||
      user.tenantId?.trim() ||
      user.session?.tenantId?.trim() ||
      '',
    roles,
    permissions,
    isPlatformAdmin,
    isTenantAdmin
  };
}
