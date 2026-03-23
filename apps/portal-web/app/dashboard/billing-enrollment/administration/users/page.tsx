import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { buildAdminConsoleBoundaryUrl } from '../../../../../lib/admin-boundary';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationUsersPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect(buildAdminConsoleBoundaryUrl('/admin/tenant/users'));
  }

  return (
    <LegacyTenantAdminReadOnly
      title="User Management"
      description="Tenant user management has moved to the dedicated admin console. This legacy billing route is now informational only."
      targetHref="/admin/tenant/users"
    />
  );
}
