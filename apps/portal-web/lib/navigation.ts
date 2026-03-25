import type {
  PlatformFeatureFlag,
  PluginAudience,
  PluginManifest,
  ResolvedPluginNavigationItem
} from '@payer-portal/plugin-sdk';
import { getPluginNavigation } from '@payer-portal/plugin-sdk';

import {
  getEnabledPluginsForTenant,
  getPlatformFeatureFlags,
  isCapabilityEnabledForTenant
} from './plugins';
import type { PortalSessionUser } from './portal-session';
import { config } from './server-runtime';
import type { TenantPortalModuleId } from './tenant-modules';
import { isTenantModuleEnabledForUser } from './tenant-modules';

export interface PortalNavigationItem {
  description: string;
  external?: boolean;
  href: string;
  label: string;
  requiredPermissions?: string[];
}

export interface PortalNavigationSection {
  items: PortalNavigationItem[];
  title: string;
}

export interface BuildPortalNavigationOptions {
  audience?: PluginAudience;
}

const BROKER_ROLES = new Set([
  'broker',
  'broker_admin',
  'broker_staff',
  'broker_readonly',
  'broker_read_only',
  'account_executive'
]);

function hasRequiredPermissions(
  userPermissions: string[],
  requiredPermissions: string[] = []
) {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

function hasRequiredRoles(userRoles: string[], requiredRoles: string[] = []) {
  if (requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.some((role) => userRoles.includes(role));
}

export function resolveNavigationAudience(
  user: PortalSessionUser,
  explicitAudience?: PluginAudience
): PluginAudience {
  if (explicitAudience) {
    return explicitAudience;
  }

  if (
    user.landingContext === 'broker' ||
    user.roles.some((role) => BROKER_ROLES.has(role))
  ) {
    return 'broker';
  }

  if (user.landingContext === 'employer') {
    return 'employer';
  }

  if (user.landingContext === 'provider') {
    return 'provider';
  }

  return 'member';
}

function isNavigationItemVisible(
  item: ResolvedPluginNavigationItem,
  user: PortalSessionUser,
  featureFlags: PlatformFeatureFlag[],
  audience: PluginAudience
) {
  const matchesAudience =
    item.audiences.length === 0 || item.audiences.includes(audience);
  const hasPermission = hasRequiredPermissions(
    user.permissions,
    item.requiredPermissions
  );
  const hasRole = hasRequiredRoles(user.roles, item.requiredRoles);
  const hasModuleAccess =
    item.moduleKeys.length === 0 ||
    item.moduleKeys.some((moduleKey) =>
      isTenantModuleEnabledForUser(user, moduleKey as TenantPortalModuleId)
    );
  const hasFeatureAccess = isCapabilityEnabledForTenant(
    featureFlags,
    item.featureFlagKeys,
    user.tenant.id
  );

  return (
    matchesAudience &&
    hasPermission &&
    hasRole &&
    hasModuleAccess &&
    hasFeatureAccess
  );
}

function buildManifestNavigationSections(
  user: PortalSessionUser,
  plugins: PluginManifest[],
  featureFlags: PlatformFeatureFlag[],
  audience: PluginAudience
) {
  const sections = new Map<string, PortalNavigationItem[]>();

  for (const plugin of plugins) {
    for (const item of getPluginNavigation(plugin)) {
      if (!isNavigationItemVisible(item, user, featureFlags, audience)) {
        continue;
      }

      const sectionTitle = item.sectionTitle;
      const sectionItems = sections.get(sectionTitle) ?? [];
      sectionItems.push({
        label: item.label,
        href: item.href,
        description: item.description ?? `${plugin.name} capability`,
        external: item.external,
        requiredPermissions: item.requiredPermissions
      });
      sections.set(sectionTitle, sectionItems);
    }
  }

  return Array.from(sections.entries()).map(([title, items]) => ({
    title,
    items
  }));
}

function buildAdminNavigation(user: PortalSessionUser) {
  const adminItems: PortalNavigationItem[] = [];

  if (
    user.roles.includes('tenant_admin') ||
    user.roles.includes('platform_admin') ||
    user.roles.includes('platform-admin')
  ) {
    adminItems.push({
      label: 'Tenant admin',
      href: `${config.serviceEndpoints.admin}/admin/tenant/health`,
      description:
        'Manage members, documents, notifications, and tenant settings.',
      external: true
    });
  }

  if (
    user.roles.includes('platform_admin') ||
    user.roles.includes('platform-admin')
  ) {
    adminItems.push({
      label: 'Platform admin',
      href: `${config.serviceEndpoints.admin}/admin/platform/health`,
      description: 'Open platform tools for tenants, users, and compliance.',
      external: true
    });
  }

  return adminItems.length > 0
    ? [
        {
          title: 'Admin',
          items: adminItems
        }
      ]
    : [];
}

export function buildPortalNavigation(
  user: PortalSessionUser,
  plugins: PluginManifest[],
  featureFlags: PlatformFeatureFlag[],
  options: BuildPortalNavigationOptions = {}
) {
  const audience = resolveNavigationAudience(user, options.audience);
  const manifestSections = buildManifestNavigationSections(
    user,
    plugins,
    featureFlags,
    audience
  );

  return [...manifestSections, ...buildAdminNavigation(user)];
}

export async function resolvePortalNavigation(
  user: PortalSessionUser,
  options: BuildPortalNavigationOptions = {}
) {
  const featureFlags = await getPlatformFeatureFlags();
  const plugins = getEnabledPluginsForTenant(featureFlags, user.tenant.id);

  return buildPortalNavigation(user, plugins, featureFlags, options);
}
