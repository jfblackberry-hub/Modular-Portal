import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationProfilePage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect('/tenant-admin/configuration');
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Tenant Configuration"
      description="Tenant profile and configuration settings now live in the tenant-admin workspace. This legacy employer route remains read-only."
      targetHref="/tenant-admin/configuration"
    />
  );
}
