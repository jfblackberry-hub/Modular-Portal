import type { PluginManifest } from '@payer-portal/plugin-sdk';

export const manifest: PluginManifest = {
  id: 'billing-enrollment',
  name: 'Billing & Enrollment',
  version: '0.1.0',
  routes: [
    {
      path: '/dashboard/billing-enrollment',
      label: 'Overview'
    },
    {
      path: '/dashboard/billing-enrollment/enrollment',
      label: 'Enrollment Orchestration'
    },
    {
      path: '/dashboard/billing-enrollment/plans',
      label: 'Plan Catalog'
    },
    {
      path: '/dashboard/billing-enrollment/plans/compare',
      label: 'Compare Plans'
    },
    {
      path: '/dashboard/billing-enrollment/rules',
      label: 'Eligibility Rules'
    },
    {
      path: '/dashboard/billing-enrollment/rules/verify',
      label: 'Verify Eligibility'
    },
    {
      path: '/dashboard/billing-enrollment/invoices',
      label: 'Invoice & Premiums'
    },
    {
      path: '/dashboard/billing-enrollment/payments',
      label: 'Payment Orchestration'
    },
    {
      path: '/dashboard/billing-enrollment/documents',
      label: 'Document Requirements'
    },
    {
      path: '/dashboard/billing-enrollment/documents/upload',
      label: 'Upload Required Documents'
    },
    {
      path: '/dashboard/billing-enrollment/renewals',
      label: 'Renewals & Life Events'
    },
    {
      path: '/dashboard/billing-enrollment/renewals/life-event',
      label: 'Report Life Event'
    },
    {
      path: '/dashboard/billing-enrollment/enrollment/start',
      label: 'Start Enrollment'
    },
    {
      path: '/dashboard/billing-enrollment/enrollment/household',
      label: 'Manage Household'
    },
    {
      path: '/dashboard/billing-enrollment/enrollment/status',
      label: 'Enrollment Status Tracker'
    },
    {
      path: '/dashboard/billing-enrollment/notices',
      label: 'Notices'
    },
    {
      path: '/dashboard/billing-enrollment/support',
      label: 'Support'
    },
    {
      path: '/dashboard/billing-enrollment/payments/current-balance',
      label: 'Current Balance'
    },
    {
      path: '/dashboard/billing-enrollment/payments/next-invoice',
      label: 'Next Invoice'
    },
    {
      path: '/dashboard/billing-enrollment/payments/history',
      label: 'Payment History'
    },
    {
      path: '/dashboard/billing-enrollment/payments/make',
      label: 'Make Payment'
    },
    {
      path: '/dashboard/billing-enrollment/payments/methods',
      label: 'Saved Payment Methods'
    },
    {
      path: '/dashboard/billing-enrollment/payments/autopay',
      label: 'Autopay'
    },
    {
      path: '/dashboard/billing-enrollment/payments/statements',
      label: 'Statements and Tax Documents'
    }
  ],
  navigation: [
    {
      label: 'Billing & Enrollment',
      href: '/dashboard/billing-enrollment'
    }
  ],
  requiredPermissions: [],
  requiredRoles: [
    'member',
    'employer_group_admin',
    'broker',
    'internal_operations',
    'internal_admin',
    'tenant_admin',
    'platform_admin',
    'platform-admin'
  ]
};
