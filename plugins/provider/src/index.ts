import type { PluginManifest } from '@payer-portal/plugin-sdk';

export const manifest: PluginManifest = {
  id: 'provider',
  name: 'Provider Services',
  version: '0.1.0',
  routes: [
    {
      path: '/dashboard/provider',
      label: 'Provider Workspace'
    }
  ],
  navigation: [
    {
      label: 'Provider',
      href: '/dashboard/provider'
    }
  ],
  requiredPermissions: ['tenant.view']
};
