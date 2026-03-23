import { redirect } from 'next/navigation';

import { PortalShell } from '../../components/portal-shell';
import { TenantTheme } from '../../components/tenant-theme';
import { buildPortalNavigation } from '../../lib/navigation';
import { getEnabledPlugins } from '../../lib/plugins';
import { resolvePortalExperience } from '../../lib/portal-experience';
import { getPortalSessionUser } from '../../lib/portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';

export default async function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  const enabledPlugins = await getEnabledPlugins(user.tenant.id);
  const navigation = buildPortalNavigation(user, enabledPlugins);
  const branding = await getTenantBranding(user.tenant, user.id, {
    experience: resolvePortalExperience(user)
  });

  return (
    <>
      <TenantTheme branding={branding} />
      <PortalShell
        branding={branding}
        navigation={navigation}
        searchBasePath="/dashboard/search"
        user={user}
      >
        {children}
      </PortalShell>
    </>
  );
}
