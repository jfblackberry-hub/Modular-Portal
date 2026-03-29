import { ProviderPortalLayout } from '../../components/provider/provider-portal-layout';
import { TenantTheme } from '../../components/tenant-theme';
import { resolveProviderPortalConfig } from '../../config/providerPortalConfig';
import { getPluginNavigationById } from '../../lib/plugins';
import { resolveProviderClinicLogoSrc } from '../../lib/provider-hero-branding';
import { getProviderPortalSessionContext } from '../../lib/provider-portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';
import {
  isTenantModuleEnabledForUser,
  type TenantPortalModuleId
} from '../../lib/tenant-modules';

export default async function ProviderLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { user, variant } = await getProviderPortalSessionContext();
  const branding = await getTenantBranding(user.tenant, user.id, {
    experience: 'provider'
  });
  const config = resolveProviderPortalConfig(variant, user.tenant.brandingConfig);
  const navigationItems = getPluginNavigationById('provider').filter((item) =>
    item.moduleKeys.length > 0
      ? item.moduleKeys.some((moduleKey) =>
          isTenantModuleEnabledForUser(user, moduleKey as TenantPortalModuleId)
        )
      : true
  );
  const providerClinicLogoSrc = resolveProviderClinicLogoSrc({
    tenantBrandingConfig: user.tenant.brandingConfig,
    fallbackLogoSrc: branding.logoUrl
  });

  return (
    <>
      <TenantTheme branding={branding} />
      <ProviderPortalLayout
        branding={{
          ...branding,
          logoUrl: providerClinicLogoSrc
        }}
        config={config}
        navigationItems={navigationItems}
        searchBasePath="/provider/dashboard"
        user={user}
      >
        {children}
      </ProviderPortalLayout>
    </>
  );
}
