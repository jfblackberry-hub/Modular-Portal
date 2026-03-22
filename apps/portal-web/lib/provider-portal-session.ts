import { redirect } from 'next/navigation';

import { resolveProviderPortalVariant } from '../config/providerPortalConfig';
import { getPortalSessionUser } from './portal-session';

export async function getProviderPortalSessionContext() {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  const isProviderUser =
    user.session.type === 'end_user' &&
    (user.landingContext === 'provider' ||
    user.roles.includes('provider') ||
    user.permissions.includes('provider.view'));

  if (!isProviderUser) {
    redirect('/login');
  }

  return {
    user,
    variant: resolveProviderPortalVariant(user.tenant.brandingConfig)
  };
}
