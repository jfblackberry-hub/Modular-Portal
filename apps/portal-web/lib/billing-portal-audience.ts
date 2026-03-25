import type { PortalSessionUser } from './portal-session';

export type BillingPortalAudience = 'employer' | 'individual' | 'broker';

const EMPLOYER_ROLES = new Set([
  'employer_group_admin',
  'internal_operations',
  'internal_admin',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
]);

const BROKER_ROLES = new Set([
  'broker',
  'broker_admin',
  'broker_staff',
  'broker_readonly',
  'broker_read_only',
  'account_executive',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
]);

const INDIVIDUAL_ROLES = new Set([
  'member',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
]);

const legacyRouteMaps: Record<
  BillingPortalAudience,
  Array<{ source: string; target: string; preserveSuffix?: boolean }>
> = {
  employer: [
    { source: '/dashboard/billing-enrollment/document-center', target: '/employer/documents', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/billing-overview', target: '/employer/billing', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/enrollment-activity', target: '/employer/eligibility-changes', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/open-enrollment', target: '/employer/enrollment', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/employees', target: '/employer/employees', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/reports', target: '/employer/reports', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/support', target: '/employer/support', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/administration', target: '/employer/admin', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/census-import', target: '/employer/employees' },
    { source: '/dashboard/billing-enrollment/tasks', target: '/employer' },
    { source: '/dashboard/billing-enrollment/notifications', target: '/employer' },
    { source: '/dashboard/billing-enrollment', target: '/employer' }
  ],
  individual: [
    { source: '/dashboard/billing-enrollment/plans/compare', target: '/individual/shop-plans/compare' },
    { source: '/dashboard/billing-enrollment/plans', target: '/individual/shop-plans' },
    { source: '/dashboard/billing-enrollment/enrollment/household', target: '/individual/household' },
    { source: '/dashboard/billing-enrollment/enrollment/status', target: '/individual/my-application' },
    { source: '/dashboard/billing-enrollment/enrollment/start', target: '/individual/my-application' },
    { source: '/dashboard/billing-enrollment/enrollment', target: '/individual/my-application' },
    { source: '/dashboard/billing-enrollment/renewals', target: '/individual/my-application' },
    { source: '/dashboard/billing-enrollment/rules/verify', target: '/individual/my-application' },
    { source: '/dashboard/billing-enrollment/payments', target: '/individual/billing-payments', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/documents', target: '/individual/documents', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/notices', target: '/individual/documents' },
    { source: '/dashboard/billing-enrollment/support', target: '/individual/support' },
    { source: '/dashboard/billing-enrollment', target: '/individual' }
  ],
  broker: [
    { source: '/dashboard/billing-enrollment/document-center', target: '/broker/documents', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/documents', target: '/broker/documents', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/billing-overview', target: '/broker/commissions' },
    { source: '/dashboard/billing-enrollment/enrollment-activity', target: '/broker/enrollments', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/open-enrollment', target: '/broker/enrollments', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/employees', target: '/broker/book-of-business' },
    { source: '/dashboard/billing-enrollment/reports', target: '/broker/book-of-business' },
    { source: '/dashboard/billing-enrollment/support', target: '/broker/support', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment/administration', target: '/broker/support' },
    { source: '/dashboard/billing-enrollment/census-import', target: '/broker/documents' },
    { source: '/dashboard/billing-enrollment/tasks', target: '/broker/tasks' },
    { source: '/dashboard/billing-enrollment/notifications', target: '/broker/tasks' },
    { source: '/dashboard/billing-enrollment/renewals', target: '/broker/renewals', preserveSuffix: true },
    { source: '/dashboard/billing-enrollment', target: '/broker' }
  ]
};

export function resolveBillingPortalAudience(
  user: Pick<PortalSessionUser, 'roles' | 'landingContext'>
): BillingPortalAudience {
  if (
    user.landingContext === 'broker' ||
    user.roles.some((role) => BROKER_ROLES.has(role))
  ) {
    return 'broker';
  }

  if (
    user.landingContext === 'employer' ||
    user.roles.some((role) => EMPLOYER_ROLES.has(role))
  ) {
    return 'employer';
  }

  return 'individual';
}

export function hasBillingPortalAudienceAccess(
  roles: string[],
  audience: BillingPortalAudience
) {
  const allowedRoles =
    audience === 'employer'
      ? EMPLOYER_ROLES
      : audience === 'broker'
        ? BROKER_ROLES
        : INDIVIDUAL_ROLES;
  return roles.some((role) => allowedRoles.has(role));
}

export function mapLegacyBillingPortalPath(
  pathname: string,
  audience: BillingPortalAudience
) {
  const mapping = legacyRouteMaps[audience].find(
    (item) =>
      pathname === item.source ||
      (item.preserveSuffix === true && pathname.startsWith(`${item.source}/`))
  );

  if (!mapping) {
    return null;
  }

  if (mapping.preserveSuffix && pathname.startsWith(`${mapping.source}/`)) {
    return `${mapping.target}${pathname.slice(mapping.source.length)}`;
  }

  return mapping.target;
}
