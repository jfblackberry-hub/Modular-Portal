import type { PluginManifest } from '@payer-portal/plugin-sdk';

const EMPLOYER_ROLES = [
  'employer_group_admin',
  'internal_operations',
  'internal_admin',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
];

const INDIVIDUAL_ROLES = [
  'member',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
];

const LICENSED_MODULES = ['billing_enrollment'];

export const manifest: PluginManifest = {
  id: 'billing-enrollment',
  name: 'Billing & Enrollment',
  version: '0.1.0',
  capabilities: [
    {
      id: 'employer_enrollment',
      label: 'Enrollment',
      description: 'Employer enrollment readiness and open enrollment workflows.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [
        { path: '/employer', label: 'Employer home' },
        { path: '/employer/enrollment', label: 'Enrollment' }
      ],
      navigation: [
        {
          label: 'Home',
          href: '/employer',
          description: 'Employer enrollment and billing command center.'
        },
        {
          label: 'Enrollment',
          href: '/employer/enrollment',
          description: 'Track open enrollment progress and employer group readiness.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_eligibility',
      label: 'Eligibility Changes',
      description: 'Employer adds, terms, and eligibility approvals.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/eligibility-changes', label: 'Eligibility Changes' }],
      navigation: [
        {
          label: 'Eligibility Changes',
          href: '/employer/eligibility-changes',
          description:
            'Review pending adds, terminations, status changes, and approvals.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_population',
      label: 'Employees',
      description: 'Employee roster and covered-lives administration.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/employees', label: 'Employees' }],
      navigation: [
        {
          label: 'Employees / Members',
          href: '/employer/employees',
          description:
            'Manage employee roster, covered lives, and dependent administration.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_billing',
      label: 'Billing',
      description: 'Employer invoices, payments, and premium activity.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/billing', label: 'Billing' }],
      navigation: [
        {
          label: 'Billing',
          href: '/employer/billing',
          description: 'Review invoices, payments, and group billing activity.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_reporting',
      label: 'Reports',
      description: 'Employer enrollment and billing reporting.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/reports', label: 'Reports' }],
      navigation: [
        {
          label: 'Reports',
          href: '/employer/reports',
          description: 'Run employer enrollment and billing reports.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_documents',
      label: 'Documents',
      description: 'Employer census, billing, and plan documents.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/documents', label: 'Documents' }],
      navigation: [
        {
          label: 'Documents',
          href: '/employer/documents',
          description: 'Upload and review census, billing, and plan documents.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_support',
      label: 'Support',
      description: 'Employer support resources and case follow-up.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/support', label: 'Support' }],
      navigation: [
        {
          label: 'Support',
          href: '/employer/support',
          description: 'Access support resources and case follow-up.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'employer_administration',
      label: 'Administration',
      description: 'Employer settings, users, and delivery preferences.',
      audiences: ['employer'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: EMPLOYER_ROLES,
      routes: [{ path: '/employer/admin', label: 'Admin' }],
      navigation: [
        {
          label: 'Admin',
          href: '/employer/admin',
          description: 'Manage employer settings, users, and delivery preferences.'
        }
      ],
      sectionTitle: 'Employer portal'
    },
    {
      id: 'individual_shopping',
      label: 'Shop Plans',
      description: 'Individual plan shopping and comparison workflows.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [
        { path: '/individual', label: 'Individual home' },
        { path: '/individual/shop-plans', label: 'Shop Plans' }
      ],
      navigation: [
        {
          label: 'Home',
          href: '/individual',
          description: 'Consumer enrollment and billing overview.'
        },
        {
          label: 'Shop Plans',
          href: '/individual/shop-plans',
          description: 'Review and compare plan options for the household.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_application',
      label: 'My Application',
      description: 'Enrollment progress, renewals, and required actions.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/my-application', label: 'My Application' }],
      navigation: [
        {
          label: 'My Application',
          href: '/individual/my-application',
          description: 'Track enrollment progress, renewals, and required actions.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_coverage',
      label: 'My Coverage',
      description: 'Active coverage, costs, and plan details.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/my-coverage', label: 'My Coverage' }],
      navigation: [
        {
          label: 'My Coverage',
          href: '/individual/my-coverage',
          description: 'Review active coverage, costs, and plan details.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_household',
      label: 'Household',
      description: 'Household members, dependents, and verification.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/household', label: 'Household' }],
      navigation: [
        {
          label: 'Household',
          href: '/individual/household',
          description: 'Manage household members, dependents, and verification.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_billing',
      label: 'Billing & Payments',
      description: 'Premium payments, invoices, and autopay.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/billing-payments', label: 'Billing & Payments' }],
      navigation: [
        {
          label: 'Billing & Payments',
          href: '/individual/billing-payments',
          description: 'Manage premium payments, invoices, and autopay.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_documents',
      label: 'Documents',
      description: 'Required documents and notices.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/documents', label: 'Documents' }],
      navigation: [
        {
          label: 'Documents',
          href: '/individual/documents',
          description: 'Upload and review required documents and notices.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_support',
      label: 'Support',
      description: 'Enrollment, billing, and documentation help.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/support', label: 'Support' }],
      navigation: [
        {
          label: 'Support',
          href: '/individual/support',
          description: 'Get help with enrollment, billing, and documentation.'
        }
      ],
      sectionTitle: 'Individual portal'
    },
    {
      id: 'individual_profile',
      label: 'Profile',
      description: 'Subscriber identity and account details.',
      audiences: ['individual'],
      moduleKeys: LICENSED_MODULES,
      requiredRoles: INDIVIDUAL_ROLES,
      routes: [{ path: '/individual/profile', label: 'Profile' }],
      navigation: [
        {
          label: 'Profile',
          href: '/individual/profile',
          description: 'Review subscriber identity and account details.'
        }
      ],
      sectionTitle: 'Individual portal'
    }
  ]
};
