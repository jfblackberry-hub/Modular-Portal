import { EmployerAdminIntegrationSettings } from '../../../../../components/billing-enrollment/EmployerAdminIntegrationSettings';
import { getIntegrationConfigsForTenant } from '../../../../../lib/employer-admin-settings-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function EmployerAdministrationIntegrationsPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return <EmployerAdminIntegrationSettings integrations={getIntegrationConfigsForTenant(tenantId)} />;
}
