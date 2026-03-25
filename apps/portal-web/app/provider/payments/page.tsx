import { ProviderPaymentsPage } from '../../../components/provider/payments/ProviderPaymentsPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderPaymentsRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);

  return <ProviderPaymentsPage config={config} variant={variant} />;
}
