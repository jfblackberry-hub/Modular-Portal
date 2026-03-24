import { buildAdminConsoleBoundaryUrl } from './admin-boundary';
import type { PortalSessionUser } from './portal-session';
import { config } from './server-runtime';

export function getAdminDestination(
  user: Pick<PortalSessionUser, 'roles' | 'landingContext'>
) {
  if (user.landingContext === 'platform_admin') {
    return '/admin/platform/health';
  }

  if (
    user.roles.includes('platform_admin') ||
    user.roles.includes('platform-admin')
  ) {
    return '/admin/platform/health';
  }

  if (
    user.landingContext === 'tenant_admin' ||
    user.roles.includes('tenant_admin')
  ) {
    return '/admin/tenant/health';
  }

  return null;
}

export function buildAdminHandoffUrl(
  user: Pick<PortalSessionUser, 'roles' | 'landingContext'>
) {
  const destination = getAdminDestination(user);

  if (!destination) {
    return null;
  }

  if (destination === '/admin/tenant/health') {
    return `${config.serviceEndpoints.admin}/login`;
  }

  return buildAdminConsoleBoundaryUrl(destination);
}
