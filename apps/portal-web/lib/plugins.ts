import { manifest as brokerPlugin } from '@payer-portal/plugin-broker';
import { manifest as enrollmentPlugin } from '@payer-portal/plugin-enrollment';
import { manifest as memberPlugin } from '@payer-portal/plugin-member';
import { manifest as providerPlugin } from '@payer-portal/plugin-provider';
import type {
  PlatformFeatureFlag,
  PluginManifest
} from '@payer-portal/plugin-sdk';
import {
  areFeatureFlagsEnabled,
  getPluginNavigation,
  getPluginFeatureFlagKey,
  getPluginRoutes,
  isPluginEnabled
} from '@payer-portal/plugin-sdk';

import { config } from './server-runtime';

const discoveredPlugins: PluginManifest[] = [
  memberPlugin,
  providerPlugin,
  brokerPlugin,
  enrollmentPlugin
];

type FeatureFlagResponse = PlatformFeatureFlag & {
  tenantName?: string | null;
  description?: string | null;
};

export function discoverPlugins() {
  return discoveredPlugins;
}

export async function getPlatformFeatureFlags() {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/feature-flags`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return [] as FeatureFlagResponse[];
    }

    return (await response.json()) as FeatureFlagResponse[];
  } catch {
    return [] as FeatureFlagResponse[];
  }
}

export function getEnabledPluginsForTenant(
  featureFlags: FeatureFlagResponse[],
  tenantId?: string | null
) {
  return discoverPlugins().filter((plugin) =>
    isPluginEnabled(plugin, featureFlags, tenantId)
  );
}

export async function getEnabledPlugins(tenantId?: string | null) {
  const featureFlags = await getPlatformFeatureFlags();
  return getEnabledPluginsForTenant(featureFlags, tenantId);
}

export function getPluginFeatureFlags() {
  return discoverPlugins().map((plugin) => ({
    pluginId: plugin.id,
    featureFlagKey: getPluginFeatureFlagKey(plugin.id)
  }));
}

export function getPluginManifestById(pluginId: string) {
  return discoverPlugins().find((plugin) => plugin.id === pluginId) ?? null;
}

export function getPluginRoutesById(pluginId: string) {
  const plugin = getPluginManifestById(pluginId);
  return plugin ? getPluginRoutes(plugin) : [];
}

export function getPluginNavigationById(pluginId: string) {
  const plugin = getPluginManifestById(pluginId);
  return plugin ? getPluginNavigation(plugin) : [];
}

export function isCapabilityEnabledForTenant(
  featureFlags: FeatureFlagResponse[],
  featureFlagKeys: string[],
  tenantId?: string | null
) {
  return areFeatureFlagsEnabled(featureFlags, featureFlagKeys, tenantId);
}
