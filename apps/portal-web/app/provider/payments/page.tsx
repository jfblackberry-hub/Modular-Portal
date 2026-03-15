import { ProviderPaymentsPage } from '../../../components/provider/payments/ProviderPaymentsPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderPaymentsRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderPaymentsPage config={config} variant={variant} />;
}
