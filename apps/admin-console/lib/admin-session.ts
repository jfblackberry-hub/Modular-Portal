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
  tenant?: {
    id?: string;
  };
}): AdminSession | null {
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const isPlatformAdmin =
    roles.includes('platform_admin') || roles.includes('platform-admin');
  const isTenantAdmin = roles.includes('tenant_admin') || isPlatformAdmin;

  if (!user.id?.trim() || !user.email?.trim() || !hasAdminConsoleAccess({
    isPlatformAdmin,
    isTenantAdmin
  })) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    tenantId: user.tenant?.id?.trim() || '',
    roles,
    permissions,
    isPlatformAdmin,
    isTenantAdmin
  };
}
