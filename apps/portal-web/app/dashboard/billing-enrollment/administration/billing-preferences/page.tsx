import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationBillingPreferencesPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect('/tenant-admin/configuration');
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Billing Preferences"
      description="Billing contact and delivery preferences are now managed from tenant-admin configuration. This legacy route is read-only."
      targetHref="/tenant-admin/configuration"
    />
  );
}
