import type { PortalSessionUser } from './portal-session';

export type PortalExperience = 'member' | 'employer' | 'provider';

const EMPLOYER_ROLE_SET = new Set([
  'employer_group_admin',
  'broker',
  'internal_operations',
  'internal_admin'
]);

export function resolvePortalExperience(user: PortalSessionUser): PortalExperience {
  if (user.landingContext === 'provider' || user.roles.includes('provider')) {
    return 'provider';
  }

  if (
    user.landingContext === 'employer' ||
    user.roles.some((role) => EMPLOYER_ROLE_SET.has(role))
  ) {
    return 'employer';
  }

  return 'member';
}
