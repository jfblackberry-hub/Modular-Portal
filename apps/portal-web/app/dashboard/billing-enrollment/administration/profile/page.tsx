import { EmployerProfileSettings } from '../../../../../components/billing-enrollment/EmployerProfileSettings';
import { getEmployerProfileForTenant } from '../../../../../lib/employer-admin-settings-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationProfilePage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const tenantName = sessionUser?.tenant.name ?? 'Employer';

  return <EmployerProfileSettings initialProfile={getEmployerProfileForTenant(tenantId, tenantName)} />;
}
