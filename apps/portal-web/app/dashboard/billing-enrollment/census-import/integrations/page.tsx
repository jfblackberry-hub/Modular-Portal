import { EmployerHrisIntegrationConfig } from '../../../../../components/billing-enrollment/EmployerHrisIntegrationConfig';
import { getEmployerDashboard } from '../../../../../lib/billing-enrollment-api';
import { getHrisConnectorsForTenant } from '../../../../../lib/hris-census-import-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function HrisIntegrationsPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const dashboard = sessionUser ? await getEmployerDashboard(sessionUser.id).catch(() => null) : null;

  return <EmployerHrisIntegrationConfig connectors={getHrisConnectorsForTenant(tenantId, dashboard?.hrisImport)} />;
}
