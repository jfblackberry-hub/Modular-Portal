import { manifest as brokerPlugin } from '@payer-portal/plugin-broker';
import { manifest as enrollmentPlugin } from '@payer-portal/plugin-enrollment';
import { manifest as memberPlugin } from '@payer-portal/plugin-member';
import { manifest as providerPlugin } from '@payer-portal/plugin-provider';
import type {
  PlatformFeatureFlag,
  PluginManifest
} from '@payer-portal/plugin-sdk';
import {
  getPluginFeatureFlagKey,
  isPluginEnabled
} from '@payer-portal/plugin-sdk';

import { apiInternalOrigin as apiBaseUrl } from './server-runtime';

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

export async function getEnabledPlugins(tenantId?: string | null) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/feature-flags`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return [];
    }

    const featureFlags = (await response.json()) as FeatureFlagResponse[];

    return discoverPlugins().filter((plugin) =>
      isPluginEnabled(plugin, featureFlags, tenantId)
    );
  } catch {
    return [];
  }
}

export function getPluginFeatureFlags() {
  return discoverPlugins().map((plugin) => ({
    pluginId: plugin.id,
    featureFlagKey: getPluginFeatureFlagKey(plugin.id)
  }));
}
