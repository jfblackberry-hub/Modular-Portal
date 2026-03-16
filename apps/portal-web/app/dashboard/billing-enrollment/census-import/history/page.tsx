import { EmployerCensusImportHistory } from '../../../../../components/billing-enrollment/EmployerCensusImportHistory';
import { getEmployerDashboard } from '../../../../../lib/billing-enrollment-api';
import { getCensusImportsForTenant } from '../../../../../lib/hris-census-import-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function CensusImportHistoryPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const dashboard = sessionUser ? await getEmployerDashboard(sessionUser.id).catch(() => null) : null;

  return <EmployerCensusImportHistory imports={getCensusImportsForTenant(tenantId, dashboard?.hrisImport)} />;
}
