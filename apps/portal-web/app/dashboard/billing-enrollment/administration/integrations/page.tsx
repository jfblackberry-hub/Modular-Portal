import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationIntegrationsPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect('/tenant-admin/integrations');
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Integration Management"
      description="Integration configuration has moved into the tenant-admin workspace. This legacy location remains read-only for employer-side users."
      targetHref="/tenant-admin/integrations"
    />
  );
}
