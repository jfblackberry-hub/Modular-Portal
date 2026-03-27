import type { AdminSession } from '../lib/admin-session';

export type AdminSectionIcon =
  | 'overview'
  | 'tenants'
  | 'tenant'
  | 'shared'
  | 'governance'
  | 'operations'
  | 'developer';

export type AdminMenuItem = {
  key: string;
  label: string;
  href: string;
  description?: string;
};

export type AdminMenuSection = {
  key: string;
  label: string;
  icon: AdminSectionIcon;
  items: AdminMenuItem[];
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

function buildPlatformSections(): AdminMenuSection[] {
  return [
    {
      key: 'overview',
      label: 'Overview',
      icon: 'overview',
      items: [
        { key: 'platform-health', label: 'Platform Health', href: '/admin/overview/health', description: 'Operational readiness across the platform.' },
        { key: 'alerts', label: 'Alerts', href: '/admin/overview/alerts', description: 'Cross-platform alert triage and escalation.' },
        { key: 'activity-feed', label: 'Activity Feed', href: '/admin/overview/activity', description: 'Recent platform and tenant administrative activity.' }
      ]
    },
    {
      key: 'tenants',
      label: 'Tenants',
      icon: 'tenants',
      items: [
        { key: 'tenant-directory', label: 'Tenant Directory', href: '/admin/tenants', description: 'Browse and select tenants.' },
        { key: 'create-tenant', label: 'Create Tenant', href: '/admin/tenants/create', description: 'Create a tenant from a template.' },
        { key: 'tenant-types', label: 'Tenant Types', href: '/admin/tenants/types', description: 'Manage tenant templates and type defaults.' }
      ]
    },
    {
      key: 'shared-services',
      label: 'Shared Services',
      icon: 'shared',
      items: [
        { key: 'integrations', label: 'Integrations', href: '/admin/shared/integrations', description: 'Shared integration control and status.' },
        { key: 'api-catalog', label: 'API Catalog', href: '/admin/shared/api-catalog', description: 'Platform API and adapter catalog.' },
        { key: 'identity-access', label: 'Identity & Access', href: '/admin/shared/identity', description: 'Access control and identity operations.' },
        { key: 'feature-flags', label: 'Feature Flags', href: '/admin/shared/feature-flags', description: 'Feature flags and global capability registry.' }
      ]
    },
    {
      key: 'governance',
      label: 'Governance',
      icon: 'governance',
      items: [
        { key: 'licensing', label: 'Licensing', href: '/admin/governance/licensing', description: 'Licensing and entitlement governance.' },
        { key: 'policies', label: 'Policies', href: '/admin/governance/policies', description: 'Platform policy catalog and guardrails.' },
        { key: 'audit-logs', label: 'Audit Logs', href: '/admin/governance/audit', description: 'Administrative audit history.' }
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: 'operations',
      items: [
        { key: 'metrics', label: 'Metrics', href: '/admin/operations/metrics', description: 'Operational metrics and telemetry.' },
        { key: 'connectivity', label: 'Connectivity', href: '/admin/operations/connectivity', description: 'Connectivity posture and external dependencies.' },
        { key: 'system-status', label: 'System Status', href: '/admin/operations/status', description: 'System availability and status reporting.' }
      ]
    }
  ];
}

function buildTenantSection(selectedTenant: { id: string; name: string }): AdminMenuSection {
  const base = `/admin/tenants/${selectedTenant.id}`;

  return {
    key: 'tenant',
    label: 'Tenant',
    icon: 'tenant',
    items: [
      { key: 'organization-structure', label: 'Organization Structure', href: `${base}/organization`, description: 'Tenant hierarchy and Organization Units.' },
      { key: 'experiences', label: 'Experiences', href: `${base}/experiences`, description: 'Experience builder and composition.' },
      { key: 'capabilities', label: 'Capabilities', href: `${base}/capabilities`, description: 'Tenant capability configuration.' },
      { key: 'users-personas', label: 'Users & Personas', href: `${base}/users`, description: 'Tenant users, admins, and personas.' },
      { key: 'data-integrations', label: 'Data & Integrations', href: `${base}/data`, description: 'Tenant data sources and integrations.' },
      { key: 'limits-usage', label: 'Limits & Usage', href: `${base}/limits`, description: 'Limits, quotas, licensing, and usage.' }
    ]
  };
}

function buildDeveloperSection(): AdminMenuSection {
  return {
    key: 'developer',
    label: 'Developer Mode',
    icon: 'developer',
    items: [
      { key: 'raw-metrics', label: 'Raw Metrics', href: '/admin/developer/raw-metrics', description: 'Prometheus and low-level metric inspection.' },
      { key: 'adapter-status', label: 'Adapter Status', href: '/admin/developer/adapters', description: 'Adapter and connector deployment posture.' },
      { key: 'debug-tools', label: 'Debug Tools', href: '/admin/developer/debug', description: 'Jobs, traces, and operator debugging tools.' }
    ]
  };
}

function flattenAdminMenuSections(sections: AdminMenuSection[]) {
  return sections.flatMap((section) =>
    section.items.map((route) => ({
      section,
      route
    }))
  );
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

  const sections: AdminMenuSection[] = [];

  if (session.isPlatformAdmin) {
    sections.push(...buildPlatformSections());
  }

  if (selectedTenant?.id) {
    sections.splice(session.isPlatformAdmin ? 2 : 0, 0, buildTenantSection(selectedTenant));
  }

  if (session.isPlatformAdmin && options.developerMode) {
    sections.push(buildDeveloperSection());
  }

  return {
    label: selectedTenant?.name
      ? `${selectedTenant.name} control plane`
      : session.isPlatformAdmin
        ? 'Platform Control Plane'
        : 'Tenant Control Plane',
    defaultHref: getDefaultAdminHref(session.isPlatformAdmin, selectedTenant?.id ?? session.tenantId),
    sections
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
    pathname === route.href || pathname.startsWith(`${route.href}/`)
  );

  if (!routeEntry) {
    return null;
  }

  return {
    section: routeEntry.section,
    route: routeEntry.route,
    roleLabel: menu.label,
    roleHref: menu.defaultHref,
    sectionLabel: routeEntry.section.label,
    sectionHref: routeEntry.section.items[0]?.href ?? menu.defaultHref
  };
}

export function canonicalizeAdminPath(pathname: string) {
  const aliases: Record<string, string> = {
    '/admin/platform/health': '/admin/overview/health',
    '/admin/platform/metrics': '/admin/operations/metrics',
    '/admin/platform/tenants': '/admin/tenants',
    '/admin/platform/tenants/provisioning': '/admin/tenants/create',
    '/admin/platform/tenants/configuration': '/admin/tenants/types',
    '/admin/platform/connectivity': '/admin/operations/connectivity',
    '/admin/platform/connectivity/catalog': '/admin/shared/api-catalog',
    '/admin/platform/connectivity/adapters': '/admin/developer/adapters',
    '/admin/platform/connectivity/identity': '/admin/shared/identity',
    '/admin/platform/licensing': '/admin/governance/licensing',
    '/admin/platform/feature-flags': '/admin/shared/feature-flags',
    '/admin/platform/audit': '/admin/governance/audit',
    '/admin/platform/audit-overview': '/admin/overview/activity',
    '/admin/platform/users': '/admin/shared/identity',
    '/admin/platform/roles': '/admin/shared/identity'
  };

  return aliases[pathname] ?? pathname;
}

export function isRetiredAdminAliasPath(pathname: string) {
  return canonicalizeAdminPath(pathname) !== pathname;
}
