import { ProviderSupportCenterPage } from '../../../components/provider/support/ProviderSupportCenterPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderSupportRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);
  const supportHeroImage = getPortalImageSrc('supportHero', {
    tenantBrandingConfig: user.tenant.brandingConfig
  });

  return <ProviderSupportCenterPage config={config} variant={variant} imageSrc={supportHeroImage} />;
}
