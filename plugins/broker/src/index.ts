import type { PluginManifest } from '@payer-portal/plugin-sdk';

const BROKER_ROLES = [
  'broker',
  'broker_admin',
  'broker_staff',
  'broker_readonly',
  'broker_read_only',
  'account_executive',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
];

export const manifest: PluginManifest = {
  id: 'broker',
  name: 'Broker Channel',
  version: '0.1.0',
  capabilities: [
    {
      id: 'broker_dashboard',
      label: 'Dashboard',
      description: 'Broker command center across groups and service activity.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker', label: 'Dashboard' }],
      navigation: [
        {
          label: 'Dashboard',
          href: '/broker',
          description:
            'Broker command center across groups, prospects, and service activity.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_book_of_business',
      label: 'Book of Business',
      description: 'Assigned groups, census readiness, and portfolio health.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/book-of-business', label: 'Book of Business' }],
      navigation: [
        {
          label: 'Book of Business',
          href: '/broker/book-of-business',
          description: 'Monitor assigned groups, census readiness, and portfolio health.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_quotes',
      label: 'Quotes',
      description: 'Quote intake, underwriting dependencies, and proposal timing.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/quotes', label: 'Quotes' }],
      navigation: [
        {
          label: 'Quotes',
          href: '/broker/quotes',
          description: 'Track quote intake, underwriting dependencies, and proposal timing.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_renewals',
      label: 'Renewals',
      description: 'Renewal timelines, missing items, and client decision points.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/renewals', label: 'Renewals' }],
      navigation: [
        {
          label: 'Renewals',
          href: '/broker/renewals',
          description: 'Manage renewal timelines, missing items, and client decision points.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_enrollments',
      label: 'Enrollments',
      description: 'Enrollment readiness and implementation activity.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/enrollments', label: 'Enrollments' }],
      navigation: [
        {
          label: 'Enrollments',
          href: '/broker/enrollments',
          description: 'Follow enrollment readiness and implementation activity across groups.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_commissions',
      label: 'Commissions',
      description: 'Statements, exceptions, and reconciliation follow-up.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/commissions', label: 'Commissions' }],
      navigation: [
        {
          label: 'Commissions',
          href: '/broker/commissions',
          description: 'Review statements, exceptions, and reconciliation follow-up.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_documents',
      label: 'Documents',
      description: 'Census, renewal, and client-submitted documentation.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/documents', label: 'Documents' }],
      navigation: [
        {
          label: 'Documents',
          href: '/broker/documents',
          description: 'Organize census, renewal, and client-submitted documentation.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_tasks',
      label: 'Tasks',
      description: 'Broker work queues, service items, and escalations.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/tasks', label: 'Tasks' }],
      navigation: [
        {
          label: 'Tasks / Cases',
          href: '/broker/tasks',
          description: 'Work open cases, service items, and escalations from one queue.'
        }
      ],
      sectionTitle: 'Broker portal'
    },
    {
      id: 'broker_support',
      label: 'Support',
      description: 'Broker support channels, training, and release guidance.',
      audiences: ['broker'],
      requiredRoles: BROKER_ROLES,
      routes: [{ path: '/broker/support', label: 'Support' }],
      navigation: [
        {
          label: 'Support / Training',
          href: '/broker/support',
          description: 'Access broker support channels, training, and release guidance.'
        }
      ],
      sectionTitle: 'Broker portal'
    }
  ]
};
