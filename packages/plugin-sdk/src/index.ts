export interface PluginRoute {
  path: string;
  label: string;
}

export interface PluginNavigationItem {
  label: string;
  href: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  routes: PluginRoute[];
  navigation: PluginNavigationItem[];
  requiredPermissions: string[];
  requiredRoles?: string[];
}

export interface PlatformFeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  tenantId: string | null;
}

export function getPluginFeatureFlagKey(pluginId: string) {
  return `plugins.${pluginId}.enabled`;
}

export function isPluginEnabled(
  plugin: PluginManifest,
  featureFlags: PlatformFeatureFlag[],
  tenantId?: string | null
) {
  const key = getPluginFeatureFlagKey(plugin.id);

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
