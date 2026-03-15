import type { PluginManifest } from '@payer-portal/plugin-sdk';

export const manifest: PluginManifest = {
  id: 'member',
  name: 'Member Experience',
  version: '0.1.0',
  routes: [
    {
      path: '/member',
      label: 'Member Home'
    },
    {
      path: '/member/profile',
      label: 'Profile'
    },
    {
      path: '/member/coverage',
      label: 'Coverage'
    },
    {
      path: '/member/claims',
      label: 'Claims'
    },
    {
      path: '/member/documents',
      label: 'Documents'
    }
  ],
  navigation: [
    {
      label: 'Member',
      href: '/member'
    },
    {
      label: 'Profile',
      href: '/member/profile'
    },
    {
      label: 'Coverage',
      href: '/member/coverage'
    },
    {
      label: 'Claims',
      href: '/member/claims'
    },
    {
      label: 'Documents',
      href: '/member/documents'
    }
  ],
  requiredPermissions: ['member.view']
};
