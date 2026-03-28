import { buildAdminConsoleBoundaryUrl } from './admin-boundary';
import type { PortalSessionUser } from './portal-session';

type AdminRedirectUser = Pick<PortalSessionUser, 'roles' | 'landingContext'> & {
  session?: Pick<PortalSessionUser['session'], 'type' | 'tenantId'>;
};

export function getAdminDestination(
  user: AdminRedirectUser
) {
  if (
    user.landingContext === 'platform_admin' ||
    user.session?.type === 'platform_admin'
  ) {
    return '/admin/overview/health';
  }

  if (
    user.roles.includes('platform_admin') ||
    user.roles.includes('platform-admin')
  ) {
    return '/admin/overview/health';
  }

  if (
    user.landingContext === 'tenant_admin' ||
    user.session?.type === 'tenant_admin' ||
    user.roles.includes('tenant_admin')
  ) {
    const tenantId = user.session?.tenantId?.trim();
    return tenantId ? `/admin/tenants/${tenantId}/organization` : '/admin';
  }

  return null;
}

export function buildAdminHandoffUrl(
  user: AdminRedirectUser
) {
  const destination = getAdminDestination(user);

  if (!destination) {
    return null;
  }

  return buildAdminConsoleBoundaryUrl(destination);
}
