import type { PortalSessionUser } from './portal-session';
import {
  isProviderClassTenantType,
  normalizeTenantTypeForArchitecture
} from '@payer-portal/shared-types';

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

function roleList(user: PortalSessionUser) {
  return user.roles ?? user.session.roles ?? [];
}

function permissionList(user: PortalSessionUser) {
  return user.permissions ?? user.session.permissions ?? [];
}

export function resolvePortalExperience(user: PortalSessionUser): PortalExperience {
  const roles = roleList(user);
  const permissions = permissionList(user);
  const normalizedTenantType = normalizeTenantTypeForArchitecture(user.tenant.tenantTypeCode);

  const isExplicitProviderContext =
    user.landingContext === 'provider' ||
    roles.includes('provider') ||
    permissions.includes('provider.view');

  const tenantSuggestsProvider =
    normalizedTenantType !== null &&
    isProviderClassTenantType(normalizedTenantType) &&
    user.landingContext !== 'tenant_admin' &&
    user.landingContext !== 'platform_admin';

  if (isExplicitProviderContext || tenantSuggestsProvider) {
    return 'provider';
  }

  if (
    user.landingContext === 'broker' ||
    roles.some((role) => BROKER_ROLE_SET.has(role))
  ) {
    return 'broker';
  }

  if (
    user.landingContext === 'employer' ||
    roles.some((role) => EMPLOYER_ROLE_SET.has(role))
  ) {
    return 'employer';
  }

  return 'member';
}
