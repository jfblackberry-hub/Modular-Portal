import type { PortalSessionUser } from './portal-session';
import { isProviderClassTenantType } from '@payer-portal/shared-types';

export type PortalExperience = 'member' | 'employer' | 'provider' | 'broker';

const BROKER_ROLE_SET = new Set([
  'broker',
  'broker_admin',
  'broker_staff',
  'broker_readonly',
  'broker_read_only',
  'account_executive'
]);

const EMPLOYER_ROLE_SET = new Set([
  'employer_group_admin',
  'internal_operations',
  'internal_admin'
]);

export function resolvePortalExperience(user: PortalSessionUser): PortalExperience {
  if (
    user.landingContext === 'provider' ||
    user.roles.includes('provider') ||
    isProviderClassTenantType(user.tenant.tenantTypeCode)
  ) {
    return 'provider';
  }

  if (
    user.landingContext === 'broker' ||
    user.roles.some((role) => BROKER_ROLE_SET.has(role))
  ) {
    return 'broker';
  }

  if (
    user.landingContext === 'employer' ||
    user.roles.some((role) => EMPLOYER_ROLE_SET.has(role))
  ) {
    return 'employer';
  }

  return 'member';
}
