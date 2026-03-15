import { ProviderResourcesLibraryPage } from '../../../components/provider/documents/ProviderResourcesLibraryPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderDocumentsRoutePage() {
  const { variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);

  return <ProviderResourcesLibraryPage config={config} />;
}
