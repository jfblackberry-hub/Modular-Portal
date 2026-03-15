import { ProviderAdminPage } from '../../../components/provider/admin/ProviderAdminPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderAdminRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderAdminPage config={config} variant={variant} />;
}
