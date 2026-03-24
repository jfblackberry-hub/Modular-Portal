import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { buildAdminConsoleBoundaryUrl } from '../../../../../lib/admin-boundary';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationIntegrationsPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect(buildAdminConsoleBoundaryUrl('/admin/tenant/connectivity'));
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Integration Management"
      description="Integration configuration has moved into the admin console. This legacy location remains read-only for employer-side users."
      targetHref="/admin/tenant/connectivity"
    />
  );
}
