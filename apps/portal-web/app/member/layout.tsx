import { redirect } from 'next/navigation';

import { PortalLayout } from '../../components/layout/portal-layout';
import { TenantTheme } from '../../components/tenant-theme';
import { resolvePortalExperience } from '../../lib/portal-experience';
import { getPortalSessionUser } from '../../lib/portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';

export default async function MemberLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect('/login');
  }

  const branding = await getTenantBranding(user.tenant, user.id, {
    experience: resolvePortalExperience(user)
  });

  return (
    <>
      <TenantTheme branding={branding} />
      <PortalLayout branding={branding} searchBasePath="/member/search" user={user}>
        {children}
      </PortalLayout>
    </>
  );
}
