export function isRetiredAdminAliasPath(pathname: string) {
  return (
    pathname === '/platform' ||
    pathname === '/platform-admin' ||
    pathname === '/tenant-admin' ||
    pathname.startsWith('/platform/') ||
    pathname.startsWith('/platform-admin/') ||
    pathname.startsWith('/tenant-admin/')
  );
}

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

  if (pathname.startsWith('/admin/')) {
    return `${pathname}${suffix}`;
  }

  if (isRetiredAdminAliasPath(pathname)) {
    return null;
  }

  return `${pathname}${suffix}`;
}
