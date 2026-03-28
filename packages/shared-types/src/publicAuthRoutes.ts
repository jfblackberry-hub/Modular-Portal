export const PUBLIC_AUTH_ROUTE_SUFFIXES = [
  '/auth/login',
  '/auth/login/provider',
  '/auth/login/employer',
  '/auth/login/catalog',
  '/auth/login/auto',
  '/auth/portal-handoffs/consume'
] as const;

export function isPublicAuthRoute(
  pathname: string,
  options: {
    prefix?: string;
  } = {}
) {
  const prefix = options.prefix ?? '';
  return PUBLIC_AUTH_ROUTE_SUFFIXES.some(
    (suffix) => pathname === `${prefix}${suffix}`
  );
}
