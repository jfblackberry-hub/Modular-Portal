import { redirect } from 'next/navigation';

import { PortalShell } from '../../components/portal-shell';
import { TenantTheme } from '../../components/tenant-theme';
import { getBrokerNavigationSections } from '../../lib/broker-portal-config';
import { hasBillingPortalAudienceAccess } from '../../lib/billing-portal-audience';
import { getPortalSessionUser } from '../../lib/portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';

export default async function BrokerPortalLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (!hasBillingPortalAudienceAccess(user.roles, 'broker')) {
    redirect('/dashboard');
  }

  const branding = await getTenantBranding(user.tenant, user.id, {
    experience: 'broker'
  });

  return (
    <>
      <TenantTheme branding={branding} />
      <PortalShell
        branding={branding}
        navigation={getBrokerNavigationSections()}
        searchBasePath="/dashboard/search"
        user={user}
      >
        {children}
      </PortalShell>
    </>
  );
}
