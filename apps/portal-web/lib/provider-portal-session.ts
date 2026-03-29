import { redirect } from 'next/navigation';

import { resolveProviderPortalVariant } from '../config/providerPortalConfig';
import { resolvePortalExperience } from './portal-experience';
import { getPortalSessionUser } from './portal-session';
import { assertProviderPocScopeGuardrails } from './provider-poc-scope';

export async function getProviderPortalSessionContext() {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (user.session.type !== 'end_user') {
    redirect('/login');
  }

  if (resolvePortalExperience(user) !== 'provider') {
    redirect('/login');
  }

  if (
    user.session.availableOrganizationUnits.length > 1 &&
    user.session.activeOrganizationUnit === null
  ) {
    redirect('/provider-login');
  }

  assertProviderPocScopeGuardrails(user.tenant.brandingConfig);

  return {
    user,
    variant: resolveProviderPortalVariant(user.tenant.brandingConfig)
  };
}
