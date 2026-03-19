import { ProviderPatientsPage } from '../../../components/provider/patients/ProviderPatientsPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderRouteScaffoldPage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderPatientsPage config={config} />;
}
