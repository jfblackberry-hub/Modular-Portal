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
      path: '/dashboard/billing-enrollment/employees',
      label: 'Employee Census'
    },
    {
      path: '/dashboard/billing-enrollment/enrollment-activity',
      label: 'Enrollment Activity Queue'
    },
    {
      path: '/dashboard/billing-enrollment/enrollment-activity/history',
      label: 'Enrollment Activity History'
    },
    {
      path: '/dashboard/billing-enrollment/open-enrollment',
      label: 'Open Enrollment Overview'
    },
    {
      path: '/dashboard/billing-enrollment/open-enrollment/[recordId]',
      label: 'Open Enrollment Employee Detail'
    },
    {
      path: '/dashboard/billing-enrollment/census-import',
      label: 'Census Import'
    },
    {
      path: '/dashboard/billing-enrollment/census-import/history',
      label: 'Census Import History'
    },
    {
      path: '/dashboard/billing-enrollment/census-import/history/[importId]',
      label: 'Census Import Detail'
    },
    {
      path: '/dashboard/billing-enrollment/census-import/errors',
      label: 'Census Import Error Resolution'
    },
    {
      path: '/dashboard/billing-enrollment/census-import/integrations',
      label: 'HRIS Integration Configuration'
    },
    {
      path: '/dashboard/billing-enrollment/tasks',
      label: 'Employer Tasks Dashboard'
    },
    {
      path: '/dashboard/billing-enrollment/tasks/[taskId]',
      label: 'Employer Task Detail'
    },
    {
      path: '/dashboard/billing-enrollment/notifications',
      label: 'Employer Notifications Center'
    },
    {
      path: '/dashboard/billing-enrollment/notifications/settings',
      label: 'Employer Notification Settings'
    },
    {
      path: '/dashboard/billing-enrollment/administration',
      label: 'Employer Administration'
    },
    {
      path: '/dashboard/billing-enrollment/administration/profile',
      label: 'Employer Profile Settings'
    },
    {
      path: '/dashboard/billing-enrollment/administration/users',
      label: 'Employer Administrator Users'
    },
    {
      path: '/dashboard/billing-enrollment/administration/billing-preferences',
      label: 'Employer Billing Preferences'
    },
    {
      path: '/dashboard/billing-enrollment/administration/notification-settings',
      label: 'Employer Administration Notification Settings'
    },
    {
      path: '/dashboard/billing-enrollment/administration/integrations',
      label: 'Employer Administration Integration Settings'
    },
    {
      path: '/dashboard/billing-enrollment/billing-overview',
      label: 'Employer Billing Overview'
    },
    {
      path: '/dashboard/billing-enrollment/billing-invoices/history',
      label: 'Employer Invoice History'
    },
    {
      path: '/dashboard/billing-enrollment/billing-payments',
      label: 'Employer Payment Management'
    },
    {
      path: '/dashboard/billing-enrollment/document-center',
      label: 'Employer Document Center'
    },
    {
      path: '/dashboard/billing-enrollment/reports/analytics',
      label: 'Reports Analytics Dashboard'
    },
    {
      path: '/dashboard/billing-enrollment/reports/schedule',
      label: 'Reports Schedule Manager'
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
