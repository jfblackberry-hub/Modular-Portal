import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { buildAdminConsoleBoundaryUrl } from '../../../../lib/admin-boundary';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployerAdministrationPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect(buildAdminConsoleBoundaryUrl('/admin/tenant/health'));
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Administrative Workspace Moved"
      description="Configuration, user management, role management, and delegated tenant administration are now managed from the dedicated admin console."
      targetHref="/admin/tenant/health"
    />
  );
}
