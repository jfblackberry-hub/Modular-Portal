import type { BillingEnrollmentRole } from '../config/billingEnrollmentModuleConfig';
import { getBillingEnrollmentVariantConfig } from '../config/billingEnrollmentModuleConfig';
import type { PortalSessionUser } from './portal-session';

const BILLING_ENROLLMENT_ROLE_SET = new Set<BillingEnrollmentRole>([
  'member',
  'employer_group_admin',
  'broker',
  'internal_operations',
  'internal_admin',
  'tenant_admin',
  'platform_admin',
  'platform-admin'
]);

const billingEnrollmentRoutePolicy = getBillingEnrollmentVariantConfig('commercial').rolePolicies;

function normalizeRoles(input: string[]) {
  return input.filter((role): role is BillingEnrollmentRole =>
    BILLING_ENROLLMENT_ROLE_SET.has(role as BillingEnrollmentRole)
  );
}

export function hasBillingEnrollmentRoleAccess(input: { roles: string[]; pathname: string }) {
  const normalizedRoles = normalizeRoles(input.roles);

  if (normalizedRoles.length === 0) {
    return false;
  }

  const policy = billingEnrollmentRoutePolicy.find(
    (item) => input.pathname === item.prefix || input.pathname.startsWith(`${item.prefix}/`)
  );

  if (!policy) {
    return normalizedRoles.length > 0;
  }

  return policy.allowedRoles.some((role) => normalizedRoles.includes(role));
}

export function hasBillingEnrollmentRoleAccessForUser(user: PortalSessionUser, pathname = '/dashboard/billing-enrollment') {
  return hasBillingEnrollmentRoleAccess({ roles: user.roles, pathname });
}

export function getBillingEnrollmentRoutePolicy() {
  return [...billingEnrollmentRoutePolicy];
}
