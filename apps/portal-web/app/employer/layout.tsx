import { redirect } from 'next/navigation';

import { PortalShell } from '../../components/portal-shell';
import { TenantTheme } from '../../components/tenant-theme';
import { hasBillingPortalAudienceAccess } from '../../lib/billing-portal-audience';
import { resolvePortalNavigation } from '../../lib/navigation';
import { getPortalSessionUser } from '../../lib/portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';

export default async function EmployerPortalLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (!hasBillingPortalAudienceAccess(user.roles, 'employer')) {
    redirect('/dashboard');
  }

  const branding = await getTenantBranding(user.tenant, user.id, {
    experience: 'employer'
  });

  return (
    <>
      <TenantTheme branding={branding} />
      <PortalShell
        branding={branding}
        navigation={await resolvePortalNavigation(user, { audience: 'employer' })}
        searchBasePath="/dashboard/search"
        user={user}
      >
        {children}
      </PortalShell>
    </>
  );
}
