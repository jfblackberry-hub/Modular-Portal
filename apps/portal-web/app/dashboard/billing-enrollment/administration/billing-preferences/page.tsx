import { redirect } from 'next/navigation';

import { LegacyTenantAdminReadOnly } from '../../../../../components/tenant-admin/legacy-tenant-admin-read-only';
import { buildAdminConsoleBoundaryUrl } from '../../../../../lib/admin-boundary';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationBillingPreferencesPage() {
  const sessionUser = await getPortalSessionUser();

  if (sessionUser?.session.type === 'tenant_admin') {
    redirect(buildAdminConsoleBoundaryUrl('/admin/tenant/configuration'));
  }

  return (
    <LegacyTenantAdminReadOnly
      title="Billing Preferences"
      description="Billing contact and delivery preferences are now managed from admin-console tenant configuration. This legacy route is read-only."
      targetHref="/admin/tenant/configuration"
    />
  );
}
