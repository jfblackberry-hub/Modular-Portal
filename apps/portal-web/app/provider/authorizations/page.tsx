import { ProviderAuthorizationsPage } from '../../../components/provider/authorizations/ProviderAuthorizationsPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderAuthorizationsRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);

  return <ProviderAuthorizationsPage config={config} variant={variant} />;
}
