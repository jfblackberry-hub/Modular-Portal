import { ProviderPortalLayout } from '../../components/provider/provider-portal-layout';
import { TenantTheme } from '../../components/tenant-theme';
import { getProviderPortalConfig } from '../../config/providerPortalConfig';
import { getProviderPortalSessionContext } from '../../lib/provider-portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';

export default async function ProviderLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { user, variant } = await getProviderPortalSessionContext();
  const branding = await getTenantBranding(user.tenant, user.id);
  const config = getProviderPortalConfig(variant);

  return (
    <>
      <TenantTheme branding={branding} />
      <ProviderPortalLayout
        branding={branding}
        config={config}
        searchBasePath="/provider/dashboard"
        user={user}
      >
        {children}
      </ProviderPortalLayout>
    </>
  );
}
