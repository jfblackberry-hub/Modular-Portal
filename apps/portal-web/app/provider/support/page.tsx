import { ProviderSupportCenterPage } from '../../../components/provider/support/ProviderSupportCenterPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderSupportRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);
  const supportHeroImage = getPortalImageSrc('supportHero', {
    tenantBrandingConfig: user.tenant.brandingConfig
  });

  return <ProviderSupportCenterPage config={config} variant={variant} imageSrc={supportHeroImage} />;
}
