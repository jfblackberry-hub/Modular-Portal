import { ProviderEligibilityPage } from '../../../components/provider/eligibility/ProviderEligibilityPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderEligibilityRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);

  return <ProviderEligibilityPage config={config} variant={variant} />;
}
