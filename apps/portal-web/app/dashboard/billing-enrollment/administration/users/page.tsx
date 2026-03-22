import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationUsersPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect('/tenant-admin/users');
  }

  return (
    <LegacyTenantAdminReadOnly
      title="User Management"
      description="Tenant user management has moved to the dedicated tenant-admin workspace. This legacy billing route is now informational only."
      targetHref="/tenant-admin/users"
    />
  );
}
