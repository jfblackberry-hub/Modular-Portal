import { ProviderPatientsPage } from '../../../components/provider/patients/ProviderPatientsPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderRouteScaffoldPage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);

  return <ProviderPatientsPage config={config} />;
}
