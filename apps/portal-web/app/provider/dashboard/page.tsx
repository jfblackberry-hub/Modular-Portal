import { ProviderDashboardPage } from '../../../components/provider/provider-dashboard-page';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import {
  resolveProviderClinicLogoSrc,
  resolveProviderClinicName,
  resolveProviderGreetingName
} from '../../../lib/provider-hero-branding';
import { getProviderOperationsDashboardSnapshot } from '../../../lib/provider-operations-snapshot';

export default async function ProviderDashboardRoutePage() {
  const { config, dashboard, user, variant } =
    await getProviderOperationsDashboardSnapshot();
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
      config={config}
      dashboard={dashboard}
      imageSrc={providerHeroImage}
      providerName={providerName}
      user={user}
    />
  );
}
