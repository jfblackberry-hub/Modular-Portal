import { ProviderMessagesPage } from '../../../components/provider/messages/ProviderMessagesPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderMessagesRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);

  return <ProviderMessagesPage config={config} variant={variant} />;
}
