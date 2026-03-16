import { EmployerAdministrationHome } from '../../../../components/billing-enrollment/EmployerAdministrationHome';
import { getEmployerAdministrationSummaryForTenant } from '../../../../lib/employer-admin-settings-data';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployerAdministrationPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return <EmployerAdministrationHome summary={getEmployerAdministrationSummaryForTenant(tenantId)} />;
}
