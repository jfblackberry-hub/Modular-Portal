import { EmployerAdminBillingPreferences } from '../../../../../components/billing-enrollment/EmployerAdminBillingPreferences';
import { getBillingPreferencesForTenant } from '../../../../../lib/employer-admin-settings-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationBillingPreferencesPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return <EmployerAdminBillingPreferences initialPreferences={getBillingPreferencesForTenant(tenantId)} />;
}
