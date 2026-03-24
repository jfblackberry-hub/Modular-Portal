import { config } from './public-runtime';

export function isDeprecatedPortalAdminPath(pathname: string) {
  return pathname === '/tenant-admin' || pathname.startsWith('/tenant-admin/');
}

export function canonicalizePortalAdminBoundaryPath(path: string | null | undefined) {
  const trimmedPath = path?.trim();

  if (!trimmedPath) {
    return '/login';
  }

  const [pathname, search = ''] = trimmedPath.split('?', 2);
  const suffix = search ? `?${search}` : '';

  if (pathname.startsWith('/admin/')) {
    return `${pathname}${suffix}`;
  }

  return '/login';
}

export function buildAdminConsoleBoundaryUrl(path: string | null | undefined) {
  const canonicalPath = canonicalizePortalAdminBoundaryPath(path);
  return new URL(canonicalPath, config.serviceEndpoints.admin).toString();
}
