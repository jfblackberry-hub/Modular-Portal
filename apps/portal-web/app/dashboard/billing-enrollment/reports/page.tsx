import { ReportsLibrary } from '../../../../components/billing-enrollment/ReportsLibrary';
import { getPortalSessionUser } from '../../../../lib/portal-session';
import {
  defaultReportFilters,
  groupReportsByCategory
} from '../../../../lib/reports-analytics-data';

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
