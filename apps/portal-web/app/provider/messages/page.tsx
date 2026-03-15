import { ProviderMessagesPage } from '../../../components/provider/messages/ProviderMessagesPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderMessagesRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderMessagesPage config={config} variant={variant} />;
}
