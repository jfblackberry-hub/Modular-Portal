import { ReportsLibrary } from '../../../../components/billing-enrollment/ReportsLibrary';
import {
  defaultReportFilters,
  groupReportsByCategory
} from '../../../../lib/reports-analytics-data';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function BillingEnrollmentReportsPage() {
  const sessionUser = await getPortalSessionUser();
  const employerName = sessionUser?.tenant.name ?? 'Employer';

  return (
    <ReportsLibrary
      groupedReports={groupReportsByCategory()}
      initialFilters={defaultReportFilters()}
      tenantName={employerName}
    />
  );
}
