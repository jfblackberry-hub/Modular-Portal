import type { PluginManifest } from '@payer-portal/plugin-sdk';

export const manifest: PluginManifest = {
  id: 'member',
  name: 'Member Experience',
  version: '0.1.0',
  requiredPermissions: ['member.view'],
  capabilities: [
    {
      id: 'member_home',
      label: 'Home',
      description: 'Member dashboard, plan summary, and quick actions.',
      audiences: ['member'],
      moduleKeys: ['member_home'],
      routes: [
        { path: '/dashboard', label: 'Home' },
        { path: '/dashboard/member', label: 'Member workspace' }
      ],
      navigation: [
        {
          label: 'Home',
          href: '/dashboard',
          description: 'Plan summary, reminders, and quick actions.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_benefits',
      label: 'Benefits',
      description: 'Coverage details and plan highlights.',
      audiences: ['member'],
      moduleKeys: ['member_benefits'],
      routes: [{ path: '/dashboard/benefits', label: 'Benefits' }],
      navigation: [
        {
          label: 'Benefits',
          href: '/dashboard/benefits',
          description: 'Coverage details and plan highlights.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_claims',
      label: 'Claims',
      description: 'Claims history and payment activity.',
      audiences: ['member'],
      moduleKeys: ['member_claims'],
      routes: [{ path: '/dashboard/claims', label: 'Claims' }],
      navigation: [
        {
          label: 'Claims',
          href: '/dashboard/claims',
          description: 'Recent claims and payment activity.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_id_card',
      label: 'ID Card',
      description: 'Digital member ID card access.',
      audiences: ['member'],
      moduleKeys: ['member_id_card'],
      routes: [{ path: '/dashboard/id-card', label: 'ID card' }],
      navigation: [
        {
          label: 'ID card',
          href: '/dashboard/id-card',
          description: 'Digital member ID card and pharmacy details.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_providers',
      label: 'Providers',
      description: 'Care search and provider directory access.',
      audiences: ['member'],
      moduleKeys: ['member_providers'],
      routes: [{ path: '/dashboard/providers', label: 'Providers' }],
      navigation: [
        {
          label: 'Providers',
          href: '/dashboard/providers',
          description: 'Find care and search provider options.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_authorizations',
      label: 'Authorizations',
      description: 'Prior authorization tracking.',
      audiences: ['member'],
      moduleKeys: ['member_authorizations'],
      routes: [{ path: '/dashboard/authorizations', label: 'Authorizations' }],
      navigation: [
        {
          label: 'Authorizations',
          href: '/dashboard/authorizations',
          description: 'Track prior authorization requests and next steps.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_messages',
      label: 'Messages',
      description: 'Secure inbox and service requests.',
      audiences: ['member'],
      moduleKeys: ['member_messages'],
      routes: [{ path: '/dashboard/messages', label: 'Messages' }],
      navigation: [
        {
          label: 'Messages',
          href: '/dashboard/messages',
          description: 'Secure inbox and service requests.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_documents',
      label: 'Documents',
      description: 'Member-facing document delivery and history.',
      audiences: ['member'],
      moduleKeys: ['member_documents'],
      routes: [{ path: '/dashboard/documents', label: 'Documents' }],
      navigation: [
        {
          label: 'Documents',
          href: '/dashboard/documents',
          description: 'Member-facing document delivery and history.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_care_navigation',
      label: 'Care Cost Estimator',
      description: 'Provider and care cost comparison tools.',
      audiences: ['member'],
      moduleKeys: ['member_care_cost_estimator'],
      routes: [{ path: '/dashboard/care-cost-estimator', label: 'Care Cost Estimator' }],
      navigation: [
        {
          label: 'Care Cost Estimator',
          href: '/dashboard/care-cost-estimator',
          description:
            'Compare providers and estimate out-of-pocket costs before you schedule care.'
        }
      ],
      sectionTitle: 'Member portal'
    },
    {
      id: 'member_support',
      label: 'Help',
      description: 'Support contacts, FAQs, and accessibility help.',
      audiences: ['member'],
      moduleKeys: ['member_support'],
      routes: [{ path: '/dashboard/help', label: 'Help' }],
      navigation: [
        {
          label: 'Help',
          href: '/dashboard/help',
          description: 'Support contacts, FAQs, and accessibility help.'
        }
      ],
      sectionTitle: 'Member portal'
    }
  ]
};
