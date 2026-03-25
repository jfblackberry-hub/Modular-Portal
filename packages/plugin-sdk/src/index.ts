export interface PluginRoute {
  path: string;
  label: string;
}

export type PluginAudience =
  | 'member'
  | 'provider'
  | 'broker'
  | 'employer'
  | 'individual';

export interface PluginNavigationItem {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  icon?: string;
  sectionTitle?: string;
}

export interface PluginCapability {
  id: string;
  label: string;
  description: string;
  routes: PluginRoute[];
  navigation: PluginNavigationItem[];
  audiences?: PluginAudience[];
  featureFlagKeys?: string[];
  requiredPermissions?: string[];
  requiredRoles?: string[];
  moduleKeys?: string[];
  sectionTitle?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  capabilities: PluginCapability[];
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export interface PlatformFeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  tenantId: string | null;
}

export interface ResolvedPluginNavigationItem extends PluginNavigationItem {
  capabilityId: string;
  featureFlagKeys: string[];
  moduleKeys: string[];
  pluginId: string;
  requiredPermissions: string[];
  requiredRoles: string[];
  sectionTitle: string;
  audiences: PluginAudience[];
}

export function getPluginFeatureFlagKey(pluginId: string) {
  return `plugins.${pluginId}.enabled`;
}

export function isFeatureFlagEnabled(
  featureFlags: PlatformFeatureFlag[],
  key: string,
  tenantId?: string | null
) {
  return featureFlags.some((featureFlag) => {
    if (featureFlag.key !== key || !featureFlag.enabled) {
      return false;
    }

    if (!featureFlag.tenantId) {
      return true;
    }

    return featureFlag.tenantId === (tenantId ?? null);
  });
}

export function areFeatureFlagsEnabled(
  featureFlags: PlatformFeatureFlag[],
  keys: string[] = [],
  tenantId?: string | null
) {
  if (keys.length === 0) {
    return true;
  }

  return keys.every((key) => isFeatureFlagEnabled(featureFlags, key, tenantId));
}

export function isPluginEnabled(
  plugin: PluginManifest,
  featureFlags: PlatformFeatureFlag[],
  tenantId?: string | null
) {
  return isFeatureFlagEnabled(
    featureFlags,
    getPluginFeatureFlagKey(plugin.id),
    tenantId
  );
}

export function getPluginRoutes(plugin: PluginManifest) {
  return plugin.capabilities.flatMap((capability) => capability.routes);
}

export function getPluginNavigation(plugin: PluginManifest) {
  return plugin.capabilities.flatMap((capability) =>
    capability.navigation.map((item) => ({
      ...item,
      audiences: capability.audiences ?? [],
      capabilityId: capability.id,
      featureFlagKeys: capability.featureFlagKeys ?? [],
      pluginId: plugin.id,
      requiredPermissions:
        capability.requiredPermissions ?? plugin.requiredPermissions ?? [],
      requiredRoles: capability.requiredRoles ?? plugin.requiredRoles ?? [],
      moduleKeys: capability.moduleKeys ?? [],
      sectionTitle: item.sectionTitle ?? capability.sectionTitle ?? plugin.name
    }))
  ) satisfies ResolvedPluginNavigationItem[];
}
