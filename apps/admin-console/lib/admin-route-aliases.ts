const legacyAdminRouteMap = new Map<string, string>([
  ['/platform', '/admin/platform/health'],
  ['/platform/audit', '/admin/platform/audit'],
  ['/platform/metrics', '/admin/platform/metrics'],
  ['/platform/settings', '/admin/platform/settings'],
  ['/platform/tenants', '/admin/platform/tenants'],
  ['/platform/tenants/create', '/admin/platform/tenants/provisioning'],
  ['/platform/users', '/admin/platform/users'],
  ['/platform-admin', '/admin/platform/health'],
  ['/platform-admin/feature-flags', '/admin/platform/feature-flags'],
  ['/platform-admin/roles', '/admin/platform/roles'],
  ['/platform-admin/tenants', '/admin/platform/tenants'],
  ['/platform-admin/users', '/admin/platform/users'],
  ['/tenant-admin', '/admin/tenant/configuration'],
  ['/tenant-admin/documents', '/admin/tenant/documents']
]);

const legacyAdminPrefixMap: Array<[prefix: string, replacement: string]> = [
  ['/platform-admin/', '/admin/platform/'],
  ['/platform/', '/admin/platform/'],
  ['/tenant-admin/', '/admin/tenant/']
];

export function canonicalizeAdminPath(path: string | null | undefined) {
  if (!path) {
    return '/admin';
  }

  const trimmedPath = path.trim();

  if (!trimmedPath.startsWith('/')) {
    return '/admin';
  }

  const [pathname, query = ''] = trimmedPath.split('?', 2);
  const suffix = query ? `?${query}` : '';

  const exactMatch = legacyAdminRouteMap.get(pathname);
  if (exactMatch) {
    return `${exactMatch}${suffix}`;
  }

  if (pathname.startsWith('/admin/')) {
    return `${pathname}${suffix}`;
  }

  for (const [legacyPrefix, canonicalPrefix] of legacyAdminPrefixMap) {
    if (pathname.startsWith(legacyPrefix)) {
      return `${canonicalPrefix}${pathname.slice(legacyPrefix.length)}${suffix}`;
    }
  }

  if (pathname === '/platform' || pathname.startsWith('/platform')) {
    return `/admin/platform/health${suffix}`;
  }

  if (pathname === '/tenant-admin' || pathname.startsWith('/tenant-admin')) {
    return `/admin/tenant/configuration${suffix}`;
  }

  return `${pathname}${suffix}`;
}
