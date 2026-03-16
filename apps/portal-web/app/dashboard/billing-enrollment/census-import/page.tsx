import { EmployerCensusImportManager } from '../../../../components/billing-enrollment/EmployerCensusImportManager';
import { getEmployerDashboard, getEmployerEmployees } from '../../../../lib/billing-enrollment-api';
import {
  buildDefaultValidationRowsForTenant,
  getCensusImportsForTenant,
  getHrisConnectorsForTenant
} from '../../../../lib/hris-census-import-data';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function CensusImportPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const tenantName = sessionUser?.tenant.name ?? 'Employer';
  const dashboard = sessionUser ? await getEmployerDashboard(sessionUser.id).catch(() => null) : null;
  const employeePayload = sessionUser ? await getEmployerEmployees(sessionUser.id).catch(() => null) : null;

  const existingEmployeeIds = (employeePayload?.employees ?? []).map(
    (employee) => employee.employeeId.toUpperCase()
  );

  return (
    <EmployerCensusImportManager
      tenantName={tenantName}
      existingEmployeeIds={existingEmployeeIds}
      importHistory={getCensusImportsForTenant(tenantId, dashboard?.hrisImport)}
      connectors={getHrisConnectorsForTenant(tenantId, dashboard?.hrisImport)}
      seededRows={buildDefaultValidationRowsForTenant(tenantId, employeePayload?.employees)}
    />
  );
}
