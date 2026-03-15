import { ProviderAuthorizationsPage } from '../../../components/provider/authorizations/ProviderAuthorizationsPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderAuthorizationsRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderAuthorizationsPage config={config} variant={variant} />;
}
