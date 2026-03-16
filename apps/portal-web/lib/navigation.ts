import type { PluginManifest } from '@payer-portal/plugin-sdk';
import type { PortalSessionUser } from './portal-session';
import type { TenantPortalModuleId } from './tenant-modules';
import { isTenantModuleEnabledForUser } from './tenant-modules';

export interface PortalNavigationItem {
  description: string;
  external?: boolean;
  href: string;
  label: string;
  moduleId?: TenantPortalModuleId;
  requiredPermissions?: string[];
}

export interface PortalNavigationSection {
  items: PortalNavigationItem[];
  title: string;
}

const memberNavigationSections: PortalNavigationSection[] = [
  {
    title: 'Member portal',
    items: [
      {
        label: 'Home',
        href: '/dashboard',
        description: 'Plan summary, reminders, and quick actions.',
        moduleId: 'member_home'
      },
      {
        label: 'Benefits',
        href: '/dashboard/benefits',
        description: 'Coverage details and plan highlights.',
        moduleId: 'member_benefits',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Claims',
        href: '/dashboard/claims',
        description: 'Recent claims and payment activity.',
        moduleId: 'member_claims',
        requiredPermissions: ['member.view']
      },
      {
        label: 'ID card',
        href: '/dashboard/id-card',
        description: 'Digital member ID card and pharmacy details.',
        moduleId: 'member_id_card',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Providers',
        href: '/dashboard/providers',
        description: 'Find care and search provider options.',
        moduleId: 'member_providers',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Authorizations',
        href: '/dashboard/authorizations',
        description: 'Track prior authorization requests and next steps.',
        moduleId: 'member_authorizations',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Messages',
        href: '/dashboard/messages',
        description: 'Secure inbox and service requests.',
        moduleId: 'member_messages',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Documents',
        href: '/dashboard/documents',
        description: 'Member-facing document delivery and history.',
        moduleId: 'member_documents',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Billing',
        href: '/dashboard/billing',
        description: 'Premiums, balances, and payment options.',
        moduleId: 'member_billing',
        requiredPermissions: ['member.view']
      },
      {
        label: 'Help',
        href: '/dashboard/help',
        description: 'Support contacts, FAQs, and accessibility help.',
        moduleId: 'member_support',
        requiredPermissions: ['member.view']
      }
    ]
  },
];

const employerNavigationSections: PortalNavigationSection[] = [
  {
    title: 'Employer portal',
    items: [
      {
        label: 'Command Center',
        href: '/dashboard/billing-enrollment',
        description: 'Employer overview, alerts, and primary actions.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Enrollment',
        href: '/dashboard/billing-enrollment/enrollment',
        description: 'Manage employee enrollments and status tracking.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Enrollment Activity',
        href: '/dashboard/billing-enrollment/enrollment-activity',
        description: 'Review pending enrollments, approvals, and errors.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Open Enrollment',
        href: '/dashboard/billing-enrollment/open-enrollment',
        description: 'Track enrollment completion and send reminders.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Employees',
        href: '/dashboard/billing-enrollment/employees',
        description: 'Search and manage employee census records.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Census Imports',
        href: '/dashboard/billing-enrollment/census-import',
        description: 'Upload census files and monitor HRIS sync imports.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Tasks',
        href: '/dashboard/billing-enrollment/tasks',
        description: 'Track and complete enrollment, billing, and compliance tasks.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Notifications',
        href: '/dashboard/billing-enrollment/notifications',
        description: 'View system alerts, activity events, and reminders.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Administration',
        href: '/dashboard/billing-enrollment/administration',
        description: 'Manage employer profile, administrators, and configuration settings.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Billing',
        href: '/dashboard/billing-enrollment/billing-overview',
        description: 'Review invoices, payments, and premium activity.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Documents',
        href: '/dashboard/billing-enrollment/document-center',
        description: 'Upload and track census and enrollment documents.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Reports',
        href: '/dashboard/billing-enrollment/reports',
        description: 'Run employer enrollment and billing reporting.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      },
      {
        label: 'Support',
        href: '/dashboard/billing-enrollment/support',
        description: 'Get enrollment and billing support resources.',
        moduleId: 'billing_enrollment',
        requiredPermissions: ['billing_enrollment.view']
      }
    ]
  }
];

const pluginModuleMap: Record<string, TenantPortalModuleId> = {
  'billing-enrollment': 'billing_enrollment'
};

function hasRequiredPermissions(
  userPermissions: string[],
  requiredPermissions: string[] = []
) {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

function hasRequiredRoles(userRoles: string[], requiredRoles: string[] = []) {
  if (requiredRoles.length === 0) {
    return true;
  }

  return requiredRoles.some((role) => userRoles.includes(role));
}

export function filterNavigationItems(
  items: PortalNavigationItem[],
  user: PortalSessionUser
) {
  return items.filter((item) => {
    const hasPermission = hasRequiredPermissions(user.permissions, item.requiredPermissions);
    const hasModuleAccess = item.moduleId ? isTenantModuleEnabledForUser(user, item.moduleId) : true;
    return hasPermission && hasModuleAccess;
  });
}

export function buildPortalNavigation(
  user: PortalSessionUser,
  plugins: PluginManifest[]
) {
  const isEmployerUser =
    user.landingContext === 'employer' ||
    user.roles.includes('employer_group_admin');
  const baseNavigationSections = isEmployerUser
    ? employerNavigationSections
    : memberNavigationSections;

  const coreSections = baseNavigationSections
    .map((section) => ({
      title: section.title,
      items: filterNavigationItems(section.items, user)
    }))
    .filter((section) => section.items.length > 0);

  const pluginItems = plugins
    .filter((plugin) =>
      hasRequiredPermissions(user.permissions, plugin.requiredPermissions) &&
      hasRequiredRoles(user.roles, plugin.requiredRoles) &&
      (pluginModuleMap[plugin.id]
        ? isTenantModuleEnabledForUser(user, pluginModuleMap[plugin.id])
        : true)
    )
    .flatMap((plugin) =>
      plugin.navigation.map((item) => ({
        label: item.label,
        href: item.href,
        description: `${plugin.name} plugin workspace`,
        requiredPermissions: plugin.requiredPermissions
      }))
    );

  const adminItems: PortalNavigationItem[] = [];

  if (
    user.roles.includes('tenant_admin') ||
    user.roles.includes('platform_admin') ||
    user.roles.includes('platform-admin')
  ) {
    adminItems.push({
      label: 'Tenant admin',
      href: 'http://localhost:3003/admin/tenant/health',
      description: 'Manage members, documents, notifications, and tenant settings.',
      external: true
    });
  }

  if (
    user.roles.includes('platform_admin') ||
    user.roles.includes('platform-admin')
  ) {
    adminItems.push({
      label: 'Platform admin',
      href: 'http://localhost:3003/admin/platform/health',
      description: 'Open platform tools for tenants, users, and compliance.',
      external: true
    });
  }

  const sections = [...coreSections];

  if (adminItems.length > 0) {
    sections.push({
      title: 'Admin',
      items: adminItems
    });
  }

  if (pluginItems.length > 0) {
    sections.push({
      title: 'Programs',
      items: pluginItems
    });
  }

  return sections;
}
