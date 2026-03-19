import { ProviderPortalLayout } from '../../components/provider/provider-portal-layout';
import { TenantTheme } from '../../components/tenant-theme';
import { getProviderPortalConfig } from '../../config/providerPortalConfig';
import { resolveProviderClinicLogoSrc } from '../../lib/provider-hero-branding';
import { getProviderPortalSessionContext } from '../../lib/provider-portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';

export default async function ProviderLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { user, variant } = await getProviderPortalSessionContext();
  const branding = await getTenantBranding(user.tenant, user.id, {
    experience: 'provider'
  });
  const config = getProviderPortalConfig(variant);
  const providerClinicLogoSrc = resolveProviderClinicLogoSrc({
    tenantBrandingConfig: user.tenant.brandingConfig
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
        searchBasePath="/provider/dashboard"
        user={user}
      >
        {children}
      </ProviderPortalLayout>
    </>
  );
}
