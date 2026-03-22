export type TenantAdminRoute = {
  href: string;
  label: string;
  description: string;
  shortLabel: string;
};

export const tenantAdminRoutes: TenantAdminRoute[] = [
  {
    href: '/tenant-admin/dashboard',
    label: 'Dashboard',
    shortLabel: 'Overview',
    description: 'Operational overview, health, and priority actions.'
  },
  {
    href: '/tenant-admin/configuration',
    label: 'Configuration',
    shortLabel: 'Settings',
    description: 'Tenant defaults, notifications, and portal settings.'
  },
  {
    href: '/tenant-admin/users',
    label: 'Users',
    shortLabel: 'Users',
    description: 'Manage tenant users, assignments, and access lifecycle.'
  },
  {
    href: '/tenant-admin/roles',
    label: 'Roles',
    shortLabel: 'Roles',
    description: 'Review tenant role coverage and permission boundaries.'
  },
  {
    href: '/tenant-admin/subtenants',
    label: 'Sub-Tenants',
    shortLabel: 'Sub-Tenants',
    description: 'Work with sub-tenant hierarchy and delegated access.'
  },
  {
    href: '/tenant-admin/integrations',
    label: 'Integrations',
    shortLabel: 'Connectors',
    description: 'Monitor connector health and tenant integration state.'
  },
  {
    href: '/tenant-admin/audit',
    label: 'Audit Logs',
    shortLabel: 'Audit',
    description: 'Inspect tenant-scoped audit activity and operator actions.'
  }
];

export function prefixTenantAdminRoute(routePrefix: string | undefined, href: string) {
  if (!routePrefix) {
    return href;
  }

  return `${routePrefix}${href}`;
}
