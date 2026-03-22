import type { PortalSessionUser } from './portal-session';

const adminConsoleBaseUrl =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ?? 'http://localhost:3003';

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

  return null;
}

export function buildAdminHandoffUrl(
  user: Pick<PortalSessionUser, 'id' | 'email' | 'roles' | 'landingContext'>
) {
  const destination = getAdminDestination(user);

  if (!destination) {
    return null;
  }

  const query = new URLSearchParams({
    admin_user_id: user.id,
    admin_email: user.email,
    redirect: destination
  });

  return `${adminConsoleBaseUrl}/login?${query.toString()}`;
}
