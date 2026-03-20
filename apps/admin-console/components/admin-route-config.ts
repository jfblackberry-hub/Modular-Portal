import type { AdminSession } from './admin-session-provider';

export type AdminRole = 'platform_admin' | 'tenant_admin';

export type AdminMenuItem = {
  href: string;
  label: string;
  description: string;
};

export type AdminMenuSection = {
  key: string;
  label: string;
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
      items: [
        {
          href: '/admin/platform/health',
          label: 'Platform Health',
          description: 'System readiness and service health checks.'
        },
        {
          href: '/admin/platform/metrics',
          label: 'Global Metrics',
          description: 'Platform-wide telemetry and raw metrics.'
        },
        {
          href: '/admin/platform/audit-overview',
          label: 'Audit Overview',
          description: 'High-level operational audit visibility.'
        }
      ]
    },
    {
      key: 'tenant-management',
      label: 'Tenant Management',
      items: [
        {
          href: '/admin/platform/tenants',
          label: 'All Tenants',
          description: 'Cross-tenant operations and health management.'
        },
        {
          href: '/admin/platform/tenants/provisioning',
          label: 'Tenant Provisioning',
          description: 'Create and onboard new tenant records.'
        },
        {
          href: '/admin/platform/tenants/configuration',
          label: 'Tenant Configuration',
          description: 'Review tenant-level configuration standards.'
        }
      ]
    },
    {
      key: 'user-administration',
      label: 'User Administration',
      items: [
        {
          href: '/admin/platform/users',
          label: 'All Users',
          description: 'Manage users across the entire platform.'
        },
        {
          href: '/admin/platform/roles',
          label: 'Role Management',
          description: 'Maintain platform RBAC roles and assignments.'
        }
      ]
    },
    {
      key: 'connectivity',
      label: 'Connectivity',
      items: [
        {
          href: '/admin/platform/connectivity',
          label: 'External Connections',
          description: 'Monitor third-party platform integrations.'
        },
        {
          href: '/admin/platform/connectivity/catalog',
          label: 'API Catalog',
          description: 'Browse strategic vendor APIs, readiness, and planning metadata.'
        },
        {
          href: '/admin/platform/connectivity/adapters',
          label: 'API / Adapter Status',
          description: 'Inspect adapter and API dependency posture.'
        },
        {
          href: '/admin/platform/connectivity/identity',
          label: 'SSO / Identity',
          description: 'Identity provider and SSO configuration status.'
        }
      ]
    },
    {
      key: 'configuration',
      label: 'Configuration',
      items: [
        {
          href: '/admin/platform/settings',
          label: 'Platform Settings',
          description: 'Shared operator defaults and platform guardrails.'
        },
        {
          href: '/admin/platform/reference-data',
          label: 'Shared Reference Data',
          description: 'Platform-shared lookup and reference data.'
        },
        {
          href: '/admin/platform/feature-flags',
          label: 'Feature Flags',
          description: 'Manage platform and tenant-scoped capabilities.'
        }
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      items: [
        {
          href: '/admin/platform/operations/jobs',
          label: 'Job Monitoring',
          description: 'Background processing visibility and execution state.'
        },
        {
          href: '/admin/platform/operations/alerts',
          label: 'System Alerts',
          description: 'Operational alert triage and escalations.'
        },
        {
          href: '/admin/platform/operations/logs',
          label: 'Logs',
          description: 'Central platform runtime and diagnostic logs.'
        }
      ]
    },
    {
      key: 'security',
      label: 'Security',
      items: [
        {
          href: '/admin/platform/audit',
          label: 'Audit Log',
          description: 'Detailed cross-tenant audit history.'
        },
        {
          href: '/admin/platform/security/permissions',
          label: 'Permission Matrix',
          description: 'Review permission coverage and role boundaries.'
        },
        {
          href: '/admin/platform/security/sessions',
          label: 'Session Management',
          description: 'Inspect admin session controls and activity.'
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
      label: 'Overview',
      items: [
        {
          href: '/admin/tenant/health',
          label: 'Tenant Health',
          description: 'Tenant readiness and operational status.'
        },
        {
          href: '/admin/tenant/metrics',
          label: 'Tenant Metrics',
          description: 'Tenant-specific service and workflow metrics.'
        }
      ]
    },
    {
      key: 'tenant-administration',
      label: 'Tenant Administration',
      items: [
        {
          href: '/admin/tenant/profile',
          label: 'Tenant Profile',
          description: 'Tenant identity, brand, and profile details.'
        },
        {
          href: '/admin/tenant/configuration',
          label: 'Tenant Configuration',
          description: 'Tenant branding, notifications, and configuration.'
        },
        {
          href: '/admin/tenant/documents',
          label: 'Documents',
          description: 'Manage tenant-owned files and operational uploads.'
        }
      ]
    },
    {
      key: 'user-administration',
      label: 'User Administration',
      items: [
        {
          href: '/admin/tenant/users',
          label: 'Tenant Users',
          description: 'Manage tenant-scoped users and access.'
        },
        {
          href: '/admin/tenant/roles',
          label: 'Roles',
          description: 'Review tenant role assignments and policies.'
        }
      ]
    },
    {
      key: 'connectivity',
      label: 'Connectivity',
      items: [
        {
          href: '/admin/tenant/connectivity',
          label: 'Tenant Connections',
          description: 'Tenant integration and connector posture.'
        },
        {
          href: '/admin/tenant/connectivity/sso',
          label: 'SSO',
          description: 'Tenant SSO and identity connection settings.'
        }
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      items: [
        {
          href: '/admin/tenant/operations/jobs',
          label: 'Job Status',
          description: 'Tenant sync jobs and execution status.'
        },
        {
          href: '/admin/tenant/operations/alerts',
          label: 'Alerts',
          description: 'Tenant-specific alerts and intervention needs.'
        }
      ]
    },
    {
      key: 'security',
      label: 'Security',
      items: [
        {
          href: '/admin/tenant/audit',
          label: 'Tenant Audit Log',
          description: 'Tenant-scoped audit events and change history.'
        },
        {
          href: '/admin/tenant/security/access',
          label: 'Access Policies',
          description: 'Tenant access policy review and governance.'
        }
      ]
    }
  ]
};

export const adminMenuByRole: Record<AdminRole, AdminMenuConfig> = {
  platform_admin: platformMenu,
  tenant_admin: tenantMenu
};

export const adminRoutes = Object.values(adminMenuByRole).flatMap((menu) =>
  menu.sections.flatMap((section) => section.items)
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
      const route = [...section.items]
        .sort((left, right) => right.href.length - left.href.length)
        .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

      if (route) {
        return {
          roleLabel: menu.label,
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
