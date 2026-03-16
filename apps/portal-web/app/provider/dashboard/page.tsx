import { ProviderDashboardPage } from '../../../components/provider/provider-dashboard-page';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderDashboardRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const providerHeroImage = getPortalImageSrc('providerHero', {
    tenantBrandingConfig: user.tenant.brandingConfig
  });

  return <ProviderDashboardPage variant={variant} imageSrc={providerHeroImage} />;
}
