import type { AdminSession } from '../lib/admin-session';

export type AdminRole = 'platform_admin' | 'tenant_admin';

export type AdminMenuItem = {
  key: string;
  label: string;
  href?: string;
  description?: string;
  items?: AdminMenuItem[];
};

export type AdminSectionIcon =
  | 'dashboard'
  | 'tenants'
  | 'users'
  | 'roles'
  | 'security'
  | 'modules'
  | 'api-catalog'
  | 'audit'
  | 'integrations';

type AdminRouteItem = AdminMenuItem & {
  href: string;
};

export type AdminMenuSection = {
  key: string;
  label: string;
  icon: AdminSectionIcon;
  items: AdminMenuItem[];
};

export type AdminMenuConfig = {
  role: AdminRole;
  label: string;
  defaultHref: string;
  sections: AdminMenuSection[];
};

const platformMenu: AdminMenuConfig = {
  role: 'platform_admin',
  label: 'Platform admin',
  defaultHref: '/admin/platform/health',
  sections: [
    {
      key: 'overview',
      label: 'Overview',
      icon: 'dashboard',
      items: [
        {
          key: 'platform-health',
          href: '/admin/platform/health',
          label: 'Platform Health',
          description: 'System readiness and service health checks.'
        },
        {
          key: 'global-metrics',
          href: '/admin/platform/metrics',
          label: 'Global Metrics',
          description: 'Platform-wide telemetry and raw metrics.'
        },
        {
          key: 'audit-overview',
          href: '/admin/platform/audit-overview',
          label: 'Audit Overview',
          description: 'High-level operational audit visibility.'
        }
      ]
    },
    {
      key: 'tenant-management',
      label: 'Tenant Management',
      icon: 'tenants',
      items: [
        {
          key: 'tenants',
          label: 'Tenants',
          description: 'Cross-tenant operations and lifecycle management.',
          items: [
            {
              key: 'all-tenants',
              href: '/admin/platform/tenants',
              label: 'All Tenants',
              description: 'Cross-tenant operations and health management.'
            },
            {
              key: 'tenant-lifecycle',
              label: 'Lifecycle',
              description: 'Provisioning and tenant setup controls.',
              items: [
                {
                  key: 'tenant-provisioning',
                  href: '/admin/platform/tenants/provisioning',
                  label: 'Tenant Provisioning',
                  description: 'Create and onboard new tenant records.'
                },
                {
                  key: 'tenant-configuration',
                  href: '/admin/platform/tenants/configuration',
                  label: 'Tenant Configuration',
                  description: 'Review tenant-level configuration standards.'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      key: 'user-administration',
      label: 'User Admin',
      icon: 'users',
      items: [
        {
          key: 'all-users',
          href: '/admin/platform/users',
          label: 'All Users',
          description: 'Manage users across the entire platform.'
        }
      ]
    },
    {
      key: 'connectivity',
      label: 'Integrations',
      icon: 'integrations',
      items: [
        {
          key: 'external-connections',
          href: '/admin/platform/connectivity',
          label: 'External Connections',
          description: 'Monitor third-party platform integrations.'
        },
        {
          key: 'api-marketplace',
          label: 'API Marketplace',
          description: 'Catalog and adapter readiness workflows.',
          items: [
            {
              key: 'api-catalog',
              href: '/admin/platform/connectivity/catalog',
              label: 'API Catalog',
              description: 'Browse strategic vendor APIs, readiness, and planning metadata.'
            },
            {
              key: 'api-adapter-status',
              href: '/admin/platform/connectivity/adapters',
              label: 'API / Adapter Status',
              description: 'Inspect adapter and API dependency posture.'
            }
          ]
        },
        {
          key: 'identity-access',
          label: 'Identity & Access',
          description: 'Identity provider and SSO posture.',
          items: [
            {
              key: 'sso-identity',
              href: '/admin/platform/connectivity/identity',
              label: 'SSO / Identity',
              description: 'Identity provider and SSO configuration status.'
            }
          ]
        }
      ]
    },
    {
      key: 'configuration',
      label: 'Modules',
      icon: 'modules',
      items: [
        {
          key: 'platform-settings',
          href: '/admin/platform/settings',
          label: 'Platform Settings',
          description: 'Shared operator defaults and platform guardrails.'
        },
        {
          key: 'shared-reference-data',
          href: '/admin/platform/reference-data',
          label: 'Shared Reference Data',
          description: 'Platform-shared lookup and reference data.'
        },
        {
          key: 'feature-flags',
          href: '/admin/platform/feature-flags',
          label: 'Feature Flags',
          description: 'Manage platform and tenant-scoped capabilities.'
        }
      ]
    },
    {
      key: 'operations',
      label: 'API Catalog',
      icon: 'api-catalog',
      items: [
        {
          key: 'catalog-workspace',
          label: 'Catalog Workspaces',
          description: 'Browse APIs and monitor adapter deployment readiness.',
          items: [
            {
              key: 'api-catalog-workspace',
              href: '/admin/platform/connectivity/catalog',
              label: 'API Catalog',
              description: 'Browse strategic vendor APIs and readiness metadata.'
            },
            {
              key: 'api-adapter-workspace',
              href: '/admin/platform/connectivity/adapters',
              label: 'Adapter Status',
              description: 'Inspect adapter posture and applied catalog templates.'
            },
            {
              key: 'job-monitoring',
              href: '/admin/platform/operations/jobs',
              label: 'Job Monitoring',
              description: 'Background processing visibility and execution state.'
            },
            {
              key: 'platform-alerts',
              href: '/admin/platform/operations/alerts',
              label: 'System Alerts',
              description: 'Operational alert triage and escalations.'
            }
          ]
        }
      ]
    },
    {
      key: 'security',
      label: 'Security',
      icon: 'security',
      items: [
        {
          key: 'permission-matrix',
          href: '/admin/platform/security/permissions',
          label: 'Permission Matrix',
          description: 'Review permission coverage and role boundaries.'
        },
        {
          key: 'session-management',
          href: '/admin/platform/security/sessions',
          label: 'Sessions',
          description: 'Launch and manage isolated admin preview sessions.'
        },
        {
          key: 'role-management',
          href: '/admin/platform/roles',
          label: 'Roles & Permissions',
          description: 'Maintain platform RBAC roles and assignments.'
        }
      ]
    },
    {
      key: 'audit-logs',
      label: 'Audit Logs',
      icon: 'audit',
      items: [
        {
          key: 'audit-log',
          href: '/admin/platform/audit',
          label: 'Audit Log',
          description: 'Detailed cross-tenant audit history.'
        },
        {
          key: 'audit-overview-workspace',
          href: '/admin/platform/audit-overview',
          label: 'Audit Overview',
          description: 'High-level operational audit visibility.'
        }
      ]
    }
  ]
};

const tenantMenu: AdminMenuConfig = {
  role: 'tenant_admin',
  label: 'Tenant admin',
  defaultHref: '/admin/tenant/health',
  sections: [
    {
      key: 'overview',
      label: 'Dashboard',
      icon: 'dashboard',
      items: [
        {
          key: 'tenant-health',
          href: '/admin/tenant/health',
          label: 'Tenant Health',
          description: 'Tenant readiness and operational status.'
        },
        {
          key: 'tenant-metrics',
          href: '/admin/tenant/metrics',
          label: 'Tenant Metrics',
          description: 'Tenant-specific service and workflow metrics.'
        }
      ]
    },
    {
      key: 'tenant-administration',
      label: 'Tenant Administration',
      icon: 'tenants',
      items: [
        {
          key: 'tenant-profile',
          href: '/admin/tenant/profile',
          label: 'Tenant Profile',
          description: 'Tenant identity, brand, and profile details.'
        },
        {
          key: 'tenant-configuration-suite',
          label: 'Tenant Setup',
          description: 'Branding, settings, and document administration.',
          items: [
            {
              key: 'tenant-configuration',
              href: '/admin/tenant/configuration',
              label: 'Tenant Configuration',
              description: 'Tenant branding, notifications, and configuration.'
            },
            {
              key: 'tenant-documents',
              href: '/admin/tenant/documents',
              label: 'Documents',
              description: 'Manage tenant-owned files and operational uploads.'
            }
          ]
        }
      ]
    },
    {
      key: 'user-administration',
      label: 'User Admin',
      icon: 'users',
      items: [
        {
          key: 'tenant-users',
          href: '/admin/tenant/users',
          label: 'Tenant Users',
          description: 'Manage tenant-scoped users and access.'
        }
      ]
    },
    {
      key: 'connectivity',
      label: 'Integrations',
      icon: 'integrations',
      items: [
        {
          key: 'tenant-connections',
          href: '/admin/tenant/connectivity',
          label: 'Tenant Connections',
          description: 'Tenant integration and connector posture.'
        },
        {
          key: 'tenant-identity',
          label: 'Identity',
          description: 'Tenant identity connection settings.',
          items: [
            {
              key: 'tenant-sso',
              href: '/admin/tenant/connectivity/sso',
              label: 'SSO',
              description: 'Tenant SSO and identity connection settings.'
            }
          ]
        }
      ]
    },
    {
      key: 'operations',
      label: 'Modules',
      icon: 'modules',
      items: [
        {
          key: 'tenant-monitoring',
          label: 'Monitoring',
          description: 'Tenant jobs and alerting workflows.',
          items: [
            {
              key: 'tenant-job-status',
              href: '/admin/tenant/operations/jobs',
              label: 'Job Status',
              description: 'Tenant sync jobs and execution status.'
            },
            {
              key: 'tenant-alerts',
              href: '/admin/tenant/operations/alerts',
              label: 'Alerts',
              description: 'Tenant-specific alerts and intervention needs.'
            }
          ]
        }
      ]
    },
    {
      key: 'security',
      label: 'Audit Logs',
      icon: 'audit',
      items: [
        {
          key: 'tenant-audit-log',
          href: '/admin/tenant/audit',
          label: 'Tenant Audit Log',
          description: 'Tenant-scoped audit events and change history.'
        },
        {
          key: 'tenant-access-policies',
          href: '/admin/tenant/security/access',
          label: 'Access Policies',
          description: 'Tenant access policy review and governance.'
        },
        {
          key: 'tenant-roles',
          href: '/admin/tenant/roles',
          label: 'Roles & Permissions',
          description: 'Review tenant role assignments and policies.'
        }
      ]
    }
  ]
};

export const adminMenuByRole: Record<AdminRole, AdminMenuConfig> = {
  platform_admin: platformMenu,
  tenant_admin: tenantMenu
};

function flattenAdminMenuItems(items: AdminMenuItem[]): AdminRouteItem[] {
  return items.flatMap((item) => [
    ...(item.href ? [{ ...item, href: item.href }] : []),
    ...(item.items ? flattenAdminMenuItems(item.items) : [])
  ]);
}

export const adminRoutes = Object.values(adminMenuByRole).flatMap((menu) =>
  menu.sections.flatMap((section) => flattenAdminMenuItems(section.items))
);

export function getAdminRole(session: AdminSession | null): AdminRole | null {
  if (session?.isPlatformAdmin) {
    return 'platform_admin';
  }

  if (session?.isTenantAdmin) {
    return 'tenant_admin';
  }

  return null;
}

export function getAdminMenu(session: AdminSession | null) {
  const role = getAdminRole(session);

  return role ? adminMenuByRole[role] : null;
}

export function getAdminRoute(pathname: string) {
  return (
    [...adminRoutes]
      .sort((left, right) => right.href.length - left.href.length)
      .find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ?? null
  );
}

export function getAdminRouteContext(pathname: string) {
  for (const menu of Object.values(adminMenuByRole)) {
    for (const section of menu.sections) {
      const route = [...flattenAdminMenuItems(section.items)]
        .sort((left, right) => right.href.length - left.href.length)
        .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

      if (route) {
        return {
          role: menu.role,
          roleHref: menu.defaultHref,
          roleLabel: menu.label,
          sectionHref: flattenAdminMenuItems(section.items)[0]?.href ?? menu.defaultHref,
          sectionLabel: section.label,
          route
        };
      }
    }
  }

  return null;
}

export function getDefaultAdminHref(isPlatformAdmin: boolean) {
  return isPlatformAdmin
    ? adminMenuByRole.platform_admin.defaultHref
    : adminMenuByRole.tenant_admin.defaultHref;
}
