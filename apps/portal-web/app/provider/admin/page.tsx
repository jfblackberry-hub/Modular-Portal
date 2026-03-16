import { ProviderAdminPage } from '../../../components/provider/admin/ProviderAdminPage';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderAdminRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);
  const adminHeroImage = getPortalImageSrc('adminHero', {
    tenantBrandingConfig: user.tenant.brandingConfig
  });

  return <ProviderAdminPage config={config} variant={variant} imageSrc={adminHeroImage} />;
}
