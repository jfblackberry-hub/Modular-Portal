import { ProviderClaimsPage } from '../../../components/provider/claims/ProviderClaimsPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderClaimsRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderClaimsPage config={config} variant={variant} />;
}
