import { ProviderAdminPage } from '../../../components/provider/admin/ProviderAdminPage';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderAdminRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);
  const adminHeroImage = getPortalImageSrc('adminHero', {
    tenantBrandingConfig: user.tenant.brandingConfig
  });

  return <ProviderAdminPage config={config} variant={variant} imageSrc={adminHeroImage} />;
}
