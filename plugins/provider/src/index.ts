import type { PluginManifest } from '@payer-portal/plugin-sdk';

export const manifest: PluginManifest = {
  id: 'provider',
  name: 'Provider Services',
  version: '0.1.0',
  requiredPermissions: ['tenant.view'],
  capabilities: [
    {
      id: 'provider_operations',
      label: 'Operations',
      description:
        'Provider operational dashboard and work queue entry points.',
      moduleKeys: ['provider_dashboard'],
      routes: [
        {
          path: '/provider/dashboard',
          label: 'Provider Dashboard'
        }
      ],
      navigation: [
        {
          label: 'Dashboard',
          href: '/provider/dashboard',
          icon: 'home'
        }
      ]
    },
    {
      id: 'provider_eligibility',
      label: 'Eligibility',
      description: 'Eligibility and benefits verification workflows.',
      moduleKeys: ['provider_eligibility'],
      routes: [
        {
          path: '/provider/eligibility',
          label: 'Eligibility & Benefits'
        }
      ],
      navigation: [
        {
          label: 'Eligibility',
          href: '/provider/eligibility',
          icon: 'shield-check'
        }
      ]
    },
    {
      id: 'provider_authorizations',
      label: 'Authorizations',
      description: 'Prior authorization and referral workflows.',
      moduleKeys: ['provider_authorizations'],
      routes: [
        {
          path: '/provider/authorizations',
          label: 'Prior Authorizations'
        }
      ],
      navigation: [
        {
          label: 'Authorizations',
          href: '/provider/authorizations',
          icon: 'clipboard-list'
        }
      ]
    },
    {
      id: 'provider_claims',
      label: 'Claims',
      description: 'Claim status, remittance, and payment workflows.',
      moduleKeys: ['provider_claims', 'provider_payments'],
      routes: [
        {
          path: '/provider/claims',
          label: 'Claims'
        },
        {
          path: '/provider/payments',
          label: 'Payments'
        }
      ],
      navigation: [
        {
          label: 'Claims & Payments',
          href: '/provider/claims',
          icon: 'file-text'
        }
      ]
    },
    {
      id: 'provider_patients',
      label: 'Patients',
      description: 'Patient roster and servicing workflows.',
      moduleKeys: ['provider_patients'],
      routes: [
        {
          path: '/provider/patients',
          label: 'Patients'
        }
      ],
      navigation: [
        {
          label: 'Patients',
          href: '/provider/patients',
          icon: 'users'
        }
      ]
    },
    {
      id: 'provider_resources',
      label: 'Documents',
      description:
        'Provider resources, forms, manuals, and operational documents.',
      moduleKeys: ['provider_documents'],
      routes: [
        {
          path: '/provider/documents',
          label: 'Provider Resources'
        }
      ],
      navigation: [
        {
          label: 'Documents',
          href: '/provider/documents',
          icon: 'folder-open'
        }
      ]
    },
    {
      id: 'provider_messages',
      label: 'Messages',
      description: 'Secure provider communications and notices.',
      moduleKeys: ['provider_messages'],
      routes: [
        {
          path: '/provider/messages',
          label: 'Messages'
        }
      ],
      navigation: [
        {
          label: 'Messages',
          href: '/provider/messages',
          icon: 'mail'
        }
      ]
    },
    {
      id: 'provider_support',
      label: 'Support',
      description:
        'Provider support resources and operational escalation paths.',
      moduleKeys: ['provider_support'],
      routes: [
        {
          path: '/provider/support',
          label: 'Support'
        }
      ],
      navigation: [
        {
          label: 'Support',
          href: '/provider/support',
          icon: 'life-buoy'
        }
      ]
    },
    {
      id: 'provider_administration',
      label: 'Administration',
      description:
        'Practice administration, user access, and provider configuration.',
      moduleKeys: ['provider_admin'],
      routes: [
        {
          path: '/provider/admin',
          label: 'Administration'
        }
      ],
      navigation: [
        {
          label: 'Admin',
          href: '/provider/admin',
          icon: 'settings'
        }
      ]
    }
  ]
};
