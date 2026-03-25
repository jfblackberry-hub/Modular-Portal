import { ProviderDashboardPage } from '../../../components/provider/provider-dashboard-page';
import { resolveProviderPortalConfig } from '../../../config/providerPortalConfig';
import { getPortalImageSrc } from '../../../lib/portal-image-registry';
import { buildPortalWorkspaceSessionKey } from '../../../lib/portal-workspace-session';
import {
  resolveProviderClinicLogoSrc,
  resolveProviderClinicName,
  resolveProviderGreetingName
} from '../../../lib/provider-hero-branding';
import { getProviderPortalSessionContext } from '../../../lib/provider-portal-session';

export default async function ProviderDashboardRoutePage() {
  const { user, variant } = await getProviderPortalSessionContext();
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);
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
  const workspaceSessionKey = buildPortalWorkspaceSessionKey({
    portal: 'provider',
    user
  });

  return (
    <ProviderDashboardPage
      clinicLogoSrc={clinicLogoSrc}
      clinicName={clinicName}
      imageSrc={providerHeroImage}
      providerName={providerName}
      sessionScopeKey={workspaceSessionKey}
      variant={variant}
    />
  );
}
