import type { PluginManifest } from '@payer-portal/plugin-sdk';

export const manifest: PluginManifest = {
  id: 'broker',
  name: 'Broker Channel',
  version: '0.1.0',
  routes: [
    {
      path: '/dashboard/broker',
      label: 'Broker Workspace'
    }
  ],
  navigation: [
    {
      label: 'Broker',
      href: '/dashboard/broker'
    }
  ],
  requiredPermissions: ['tenant.view']
};
