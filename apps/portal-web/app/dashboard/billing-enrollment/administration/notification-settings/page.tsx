import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { buildAdminConsoleBoundaryUrl } from '../../../../../lib/admin-boundary';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationNotificationSettingsPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect(buildAdminConsoleBoundaryUrl('/admin/tenant/configuration'));
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Notification Settings"
      description="Tenant notification settings are now managed within admin-console tenant configuration. This employer route is read-only."
      targetHref="/admin/tenant/configuration"
    />
  );
}
