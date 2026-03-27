import { redirect } from 'next/navigation';
import { isProviderClassTenantType } from '@payer-portal/shared-types';

import { resolveProviderPortalVariant } from '../config/providerPortalConfig';
import { getPortalSessionUser } from './portal-session';
import { assertProviderPocScopeGuardrails } from './provider-poc-scope';

export async function getProviderPortalSessionContext() {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  const isProviderUser =
    user.session.type === 'end_user' &&
    (user.landingContext === 'provider' ||
      user.roles.includes('provider') ||
      user.permissions.includes('provider.view') ||
      isProviderClassTenantType(user.tenant.tenantTypeCode));

  if (!isProviderUser) {
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
