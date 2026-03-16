import { ProviderResourcesLibraryPage } from '../../../components/provider/documents/ProviderResourcesLibraryPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderDocumentsRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);
  const documentsHeroImage = getPortalImageSrc('documentsHero', {
    tenantBrandingConfig: user.tenant.brandingConfig
  });

  return <ProviderResourcesLibraryPage config={config} imageSrc={documentsHeroImage} />;
}
