import { ProviderSupportCenterPage } from '../../../components/provider/support/ProviderSupportCenterPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderSupportRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderSupportCenterPage config={config} variant={variant} />;
}
