import { resolveProviderPortalConfig } from '../config/providerPortalConfig';
import { resolveProviderOperationsDashboardData } from './provider-operations-data';
import { getProviderPortalSessionContext } from './provider-portal-session';

export async function getProviderOperationsDashboardSnapshot() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);
  const dashboard = await resolveProviderOperationsDashboardData({
    config,
    user
  });

  return {
    config,
    dashboard,
    user,
    variant
  };
}
