import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationNotificationSettingsPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect('/tenant-admin/configuration');
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Notification Settings"
      description="Tenant notification settings are now managed within tenant-admin configuration. This employer route is read-only."
      targetHref="/tenant-admin/configuration"
    />
  );
}
