import { ProviderEligibilityPage } from '../../../components/provider/eligibility/ProviderEligibilityPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderEligibilityRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderEligibilityPage config={config} variant={variant} />;
}
