import type { AdminSession } from '../lib/admin-session';

export type AdminSectionIcon =
  | 'overview'
  | 'tenant-management'
  | 'tenant-workspace'
  | 'shared-services'
  | 'access-control'
  | 'configuration'
  | 'audit-operations'
  | 'developer';

export type AdminPermissionKey =
  | 'platform-admin'
  | 'tenant-admin'
  | 'selected-tenant'
  | 'developer-mode';

export type AdminMenuItem = {
  key: string;
  label: string;
  href: string;
  description?: string;
  aliases?: string[];
  permissionKey?: AdminPermissionKey;
  isVisible?: (context: AdminVisibilityContext) => boolean;
};

export type AdminMenuSection = {
  key: string;
  label: string;
  icon: AdminSectionIcon;
  items: AdminMenuItem[];
  permissionKey?: AdminPermissionKey;
  isVisible?: (context: AdminVisibilityContext) => boolean;
};

export type AdminMenuConfig = {
  label: string;
  defaultHref: string;
  sections: AdminMenuSection[];
};

type AdminRouteContext = {
  section: AdminMenuSection;
  route: AdminMenuItem;
  roleLabel: string;
  roleHref: string;
  sectionLabel: string;
  sectionHref: string;
};

type AdminMenuOptions = {
  developerMode?: boolean;
  selectedTenant?: {
    id: string;
    name: string;
  } | null;
};

type AdminVisibilityContext = {
  developerMode: boolean;
  selectedTenant?: {
    id: string;
    name: string;
  } | null;
  session: AdminSession;
};

type BaseAdminRouteDefinition = {
  description?: string;
  href: string;
  key: string;
  label: string;
  aliases?: string[];
  permissionKey?: AdminPermissionKey;
  isVisible?: (context: AdminVisibilityContext) => boolean;
};

type BaseAdminSectionDefinition = {
  icon: AdminSectionIcon;
  items: BaseAdminRouteDefinition[];
  key: string;
  label: string;
  permissionKey?: AdminPermissionKey;
  isVisible?: (context: AdminVisibilityContext) => boolean;
};

const PLATFORM_ADMIN_SECTIONS: BaseAdminSectionDefinition[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'overview',
    permissionKey: 'platform-admin',
    items: [
      {
        key: 'platform-health',
        label: 'Platform Health',
        href: '/admin/overview/health',
        aliases: ['/admin/platform/health'],
        description: 'Operational readiness across the platform.'
      },
      {
        key: 'alerts',
        label: 'Alerts',
        href: '/admin/overview/alerts',
        description: 'Cross-platform alert triage and escalation.'
      },
      {
        key: 'activity-feed',
        label: 'Activity Feed',
        href: '/admin/overview/activity',
        aliases: ['/admin/platform/audit-overview'],
        description: 'Recent platform and tenant administrative activity.'
      }
    ]
  },
  {
    key: 'tenant-management',
    label: 'Tenant Management',
    icon: 'tenant-management',
    permissionKey: 'platform-admin',
    items: [
      {
        key: 'tenant-directory',
        label: 'Tenant Directory',
        href: '/admin/tenants',
        aliases: ['/admin/platform/tenants'],
        description: 'Browse, select, and manage active tenants.'
      },
      {
        key: 'create-tenant',
        label: 'Create Tenant',
        href: '/admin/tenants/create',
        description: 'Provision a new tenant from a supported template.'
      },
      {
        key: 'tenant-types',
        label: 'Tenant Types',
        href: '/admin/tenants/types',
        aliases: ['/admin/platform/tenants/configuration'],
        description: 'Manage tenant templates and type defaults.'
      },
      {
        key: 'tenant-provisioning',
        label: 'Provisioning',
        href: '/admin/platform/tenants/provisioning',
        description: 'Review provisioning workflow and setup progress.'
      }
    ]
  },
  {
    key: 'shared-services',
    label: 'Shared Services',
    icon: 'shared-services',
    permissionKey: 'platform-admin',
    items: [
      {
        key: 'integrations',
        label: 'Integrations',
        href: '/admin/shared/integrations',
        description: 'Shared integration control and status.'
      },
      {
        key: 'api-catalog',
        label: 'API Catalog',
        href: '/admin/shared/api-catalog',
        aliases: ['/admin/platform/connectivity/catalog'],
        description: 'Platform APIs, adapters, and integration catalog.'
      }
    ]
  },
  {
    key: 'access-control',
    label: 'Access Control',
    icon: 'access-control',
    permissionKey: 'platform-admin',
    items: [
      {
        key: 'identity-access-overview',
        label: 'Identity & Access Overview',
        href: '/admin/shared/identity',
        aliases: ['/admin/platform/users', '/admin/platform/roles'],
        description: 'Identity governance and access model overview.'
      },
      {
        key: 'security-permissions',
        label: 'Permissions',
        href: '/admin/platform/security/permissions',
        description: 'Review administrative permissions and assignments.'
      },
      {
        key: 'security-sessions',
        label: 'Sessions',
        href: '/admin/platform/security/sessions',
        description: 'Inspect privileged sessions and session posture.'
      },
      {
        key: 'user-emulation',
        label: 'User Emulation',
        href: '/admin/overview/emulation',
        description: 'Launch and revoke isolated preview sessions.'
      }
    ]
  },
  {
    key: 'configuration',
    label: 'Configuration',
    icon: 'configuration',
    permissionKey: 'platform-admin',
    items: [
      {
        key: 'feature-flags',
        label: 'Feature Flags',
        href: '/admin/shared/feature-flags',
        aliases: ['/admin/platform/feature-flags', '/admin/platform/settings'],
        description: 'Manage platform feature availability and release gates.'
      },
      {
        key: 'reference-data',
        label: 'Reference Data',
        href: '/admin/platform/reference-data',
        description: 'Control shared reference data and value sets.'
      },
      {
        key: 'policies',
        label: 'Policies',
        href: '/admin/governance/policies',
        description: 'Platform policy catalog and guardrails.'
      },
      {
        key: 'licensing',
        label: 'Licensing',
        href: '/admin/governance/licensing',
        aliases: ['/admin/platform/licensing'],
        description: 'Licensing, entitlement, and usage governance.'
      }
    ]
  },
  {
    key: 'audit-operations',
    label: 'Audit & Operations',
    icon: 'audit-operations',
    permissionKey: 'platform-admin',
    items: [
      {
        key: 'audit-logs',
        label: 'Audit Logs',
        href: '/admin/governance/audit',
        aliases: ['/admin/platform/audit'],
        description: 'Administrative audit history and traceability.'
      },
      {
        key: 'metrics',
        label: 'Metrics',
        href: '/admin/operations/metrics',
        aliases: ['/admin/platform/metrics'],
        description: 'Operational metrics and telemetry.'
      },
      {
        key: 'connectivity',
        label: 'Connectivity',
        href: '/admin/operations/connectivity',
        aliases: ['/admin/platform/connectivity'],
        description: 'External dependency posture and connectivity health.'
      },
      {
        key: 'system-status',
        label: 'System Status',
        href: '/admin/operations/status',
        description: 'System availability and service status reporting.'
      },
      {
        key: 'jobs',
        label: 'Jobs',
        href: '/admin/platform/operations/jobs',
        description: 'Queued and running background jobs.'
      },
      {
        key: 'operations-alerts',
        label: 'Operations Alerts',
        href: '/admin/platform/operations/alerts',
        description: 'Operator-facing alert queue and escalation flow.'
      },
      {
        key: 'operations-logs',
        label: 'Operations Logs',
        href: '/admin/platform/operations/logs',
        description: 'Runtime and operator-facing diagnostic logs.'
      }
    ]
  },
  {
    key: 'developer',
    label: 'Developer Tools',
    icon: 'developer',
    permissionKey: 'developer-mode',
    items: [
      {
        key: 'raw-metrics',
        label: 'Raw Metrics',
        href: '/admin/developer/raw-metrics',
        description: 'Low-level metrics inspection and raw telemetry.'
      },
      {
        key: 'adapter-status',
        label: 'Adapter Status',
        href: '/admin/developer/adapters',
        aliases: ['/admin/platform/connectivity/adapters'],
        description: 'Adapter inventory and deployment posture.'
      },
      {
        key: 'debug-tools',
        label: 'Debug Tools',
        href: '/admin/developer/debug',
        aliases: ['/admin/platform/connectivity/identity'],
        description: 'Operator debug tools, traces, and diagnostics.'
      }
    ]
  }
];

function buildSelectedTenantSection(selectedTenant: { id: string; name: string }): BaseAdminSectionDefinition {
  const base = `/admin/tenants/${selectedTenant.id}`;

  return {
    key: 'selected-tenant',
    label: 'Selected Tenant',
    icon: 'tenant-workspace',
    permissionKey: 'selected-tenant',
    items: [
      {
        key: 'tenant-organization',
        label: 'Organization Structure',
        href: `${base}/organization`,
        aliases: ['/admin/tenant/profile'],
        description: 'Tenant hierarchy and organization units.'
      },
      {
        key: 'tenant-configuration',
        label: 'Configuration & Branding',
        href: `${base}/configuration`,
        aliases: ['/admin/tenant/configuration'],
        description: 'Branding, notifications, and tenant settings.'
      },
      {
        key: 'tenant-limits',
        label: 'Limits & Usage',
        href: `${base}/limits`,
        description: 'Licensing, quotas, and tenant usage review.'
      },
      {
        key: 'tenant-experiences',
        label: 'Experiences',
        href: `${base}/experiences`,
        description: 'Tenant-scoped experience composition.'
      },
      {
        key: 'tenant-capabilities',
        label: 'Capabilities',
        href: `${base}/capabilities`,
        description: 'Capability assignments for the selected tenant.'
      },
      {
        key: 'tenant-users-personas',
        label: 'Users & Personas',
        href: `${base}/users`,
        aliases: ['/admin/tenant/users'],
        description: 'Manage tenant users, admins, and personas.'
      },
      {
        key: 'tenant-data-integrations',
        label: 'Data & Integrations',
        href: `${base}/data`,
        description: 'Tenant data sources and integration setup.'
      }
    ]
  };
}

function buildTenantAdminSections(selectedTenant: { id: string; name: string }): BaseAdminSectionDefinition[] {
  return [
    {
      key: 'tenant-workspace',
      label: 'Tenant Workspace',
      icon: 'tenant-workspace',
      permissionKey: 'tenant-admin',
      items: buildSelectedTenantSection(selectedTenant).items
    }
  ];
}

function hasPermission(
  permissionKey: AdminPermissionKey | undefined,
  context: AdminVisibilityContext
) {
  switch (permissionKey) {
    case 'platform-admin':
      return context.session.isPlatformAdmin;
    case 'tenant-admin':
      return !context.session.isPlatformAdmin;
    case 'selected-tenant':
      return Boolean(context.selectedTenant?.id);
    case 'developer-mode':
      return context.session.isPlatformAdmin && context.developerMode;
    default:
      return true;
  }
}

function toMenuItem(
  item: BaseAdminRouteDefinition,
  context: AdminVisibilityContext
): AdminMenuItem | null {
  if (!hasPermission(item.permissionKey, context)) {
    return null;
  }

  if (item.isVisible && !item.isVisible(context)) {
    return null;
  }

  return {
    aliases: item.aliases,
    description: item.description,
    href: item.href,
    key: item.key,
    label: item.label,
    permissionKey: item.permissionKey
  };
}

function toMenuSection(
  section: BaseAdminSectionDefinition,
  context: AdminVisibilityContext
): AdminMenuSection | null {
  if (!hasPermission(section.permissionKey, context)) {
    return null;
  }

  if (section.isVisible && !section.isVisible(context)) {
    return null;
  }

  const items = section.items
    .map((item) => toMenuItem(item, context))
    .filter((item): item is AdminMenuItem => Boolean(item));

  if (!items.length) {
    return null;
  }

  return {
    icon: section.icon,
    items,
    key: section.key,
    label: section.label,
    permissionKey: section.permissionKey
  };
}

function matchesAdminPath(pathname: string, item: AdminMenuItem) {
  const candidates = [item.href, ...(item.aliases ?? [])];

  return candidates.some(
    (candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`)
  );
}

function flattenAdminMenuSections(sections: AdminMenuSection[]) {
  return sections.flatMap((section) =>
    section.items.map((route) => ({
      route,
      section
    }))
  );
}

function buildMenuSections(context: AdminVisibilityContext): AdminMenuSection[] {
  // The admin sidebar is intentionally curated rather than inferred from route depth.
  // That keeps the IA stable, limited to two levels, and safe to extend over time.
  const sectionDefinitions = context.session.isPlatformAdmin
    ? [
        ...PLATFORM_ADMIN_SECTIONS.slice(0, 2),
        ...(context.selectedTenant?.id ? [buildSelectedTenantSection(context.selectedTenant)] : []),
        ...PLATFORM_ADMIN_SECTIONS.slice(2)
      ]
    : context.selectedTenant?.id
      ? buildTenantAdminSections(context.selectedTenant)
      : [];

  return sectionDefinitions
    .map((section) => toMenuSection(section, context))
    .filter((section): section is AdminMenuSection => Boolean(section));
}

export function getDefaultAdminHref(
  isPlatformAdmin: boolean,
  selectedTenantId?: string | null
) {
  if (isPlatformAdmin) {
    return '/admin/overview/health';
  }

  const tenantId = selectedTenantId?.trim();
  return tenantId ? `/admin/tenants/${tenantId}/organization` : '/admin';
}

export function getAdminMenu(
  session: AdminSession | null,
  options: AdminMenuOptions = {}
): AdminMenuConfig | null {
  if (!session) {
    return null;
  }

  const selectedTenant =
    options.selectedTenant ??
    (!session.isPlatformAdmin && session.tenantId
      ? {
          id: session.tenantId,
          name: 'Current Tenant'
        }
      : null);

  const context: AdminVisibilityContext = {
    developerMode: options.developerMode ?? false,
    selectedTenant,
    session
  };

  return {
    label: selectedTenant?.name
      ? `${selectedTenant.name} control plane`
      : session.isPlatformAdmin
        ? 'Platform Control Plane'
        : 'Tenant Control Plane',
    defaultHref: getDefaultAdminHref(
      session.isPlatformAdmin,
      selectedTenant?.id ?? session.tenantId
    ),
    sections: buildMenuSections(context)
  };
}

export function getAdminRouteContext(
  pathname: string,
  session?: AdminSession | null,
  options: AdminMenuOptions = {}
): AdminRouteContext | null {
  const menu = getAdminMenu(session ?? null, options);

  if (!menu) {
    return null;
  }

  const routeEntry = flattenAdminMenuSections(menu.sections).find(({ route }) =>
    matchesAdminPath(pathname, route)
  );

  if (!routeEntry) {
    return null;
  }

  return {
    roleHref: menu.defaultHref,
    roleLabel: menu.label,
    route: routeEntry.route,
    section: routeEntry.section,
    sectionHref: routeEntry.section.items[0]?.href ?? menu.defaultHref,
    sectionLabel: routeEntry.section.label
  };
}

export function canonicalizeAdminPath(pathname: string) {
  const aliases: Record<string, string> = {
    '/admin/platform/health': '/admin/overview/health',
    '/admin/platform/metrics': '/admin/operations/metrics',
    '/admin/platform/tenants': '/admin/tenants',
    '/admin/platform/tenants/configuration': '/admin/tenants/types',
    '/admin/platform/licensing': '/admin/governance/licensing',
    '/admin/platform/feature-flags': '/admin/shared/feature-flags',
    '/admin/platform/settings': '/admin/shared/feature-flags',
    '/admin/platform/audit': '/admin/governance/audit',
    '/admin/platform/audit-overview': '/admin/overview/activity',
    '/admin/platform/users': '/admin/shared/identity',
    '/admin/platform/roles': '/admin/shared/identity',
    '/admin/platform/connectivity': '/admin/operations/connectivity',
    '/admin/platform/connectivity/catalog': '/admin/shared/api-catalog',
    '/admin/platform/connectivity/adapters': '/admin/developer/adapters',
    '/admin/platform/connectivity/identity': '/admin/developer/debug',
    '/admin/tenant/profile': '/admin/tenant/profile',
    '/admin/tenant/configuration': '/admin/tenant/configuration',
    '/admin/tenant/users': '/admin/tenant/users'
  };

  return aliases[pathname] ?? pathname;
}

export function isRetiredAdminAliasPath(pathname: string) {
  return canonicalizeAdminPath(pathname) !== pathname;
}
