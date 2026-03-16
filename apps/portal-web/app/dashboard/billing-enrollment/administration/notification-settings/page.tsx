import { EmployerAdminNotificationSettings } from '../../../../../components/billing-enrollment/EmployerAdminNotificationSettings';
import { getAdminNotificationPreferencesForTenant } from '../../../../../lib/employer-admin-settings-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationNotificationSettingsPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return <EmployerAdminNotificationSettings initialPreferences={getAdminNotificationPreferencesForTenant(tenantId)} />;
}
