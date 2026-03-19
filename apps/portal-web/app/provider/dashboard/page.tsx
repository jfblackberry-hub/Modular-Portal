import { ProviderDashboardPage } from '../../../components/provider/provider-dashboard-page';
import { getProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import {
  resolveProviderClinicLogoSrc,
  resolveProviderClinicName,
  resolveProviderGreetingName
} from '../../../lib/provider-hero-branding';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderDashboardRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = getProviderPortalConfig(variant);
  const providerHeroImage =
    variant === 'medical'
      ? '/assets/portal-images/custom/provider-dashboard-physician-hero.png'
      : getPortalImageSrc('providerHero', {
          tenantBrandingConfig: user.tenant.brandingConfig
        });
  const clinicName = resolveProviderClinicName({
    tenantBrandingConfig: user.tenant.brandingConfig,
    practiceName: config.providerContext.practiceName
  });
  const clinicLogoSrc = resolveProviderClinicLogoSrc({
    tenantBrandingConfig: user.tenant.brandingConfig
  });
  const providerName = resolveProviderGreetingName({
    firstName: user.firstName,
    lastName: user.lastName,
    configuredProviderName: config.providerContext.providerName
  });

  return (
    <ProviderDashboardPage
      clinicLogoSrc={clinicLogoSrc}
      clinicName={clinicName}
      imageSrc={providerHeroImage}
      providerName={providerName}
      variant={variant}
    />
  );
}
