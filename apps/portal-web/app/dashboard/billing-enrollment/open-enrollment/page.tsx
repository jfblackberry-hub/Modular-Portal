import { OpenEnrollmentOverview } from '../../../../components/billing-enrollment/OpenEnrollmentOverview';
import {
  getOpenEnrollmentAnalyticsForTenant,
  getOpenEnrollmentCycleForTenant,
  getOpenEnrollmentFilterOptions,
  getOpenEnrollmentRecordsForTenant,
  getOpenEnrollmentSummaryForTenant
} from '../../../../lib/open-enrollment-data';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function OpenEnrollmentOverviewPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  const cycle = getOpenEnrollmentCycleForTenant(tenantId);
  const records = getOpenEnrollmentRecordsForTenant(tenantId);
  const summary = getOpenEnrollmentSummaryForTenant(tenantId);
  const analytics = getOpenEnrollmentAnalyticsForTenant(tenantId);
  const filterOptions = getOpenEnrollmentFilterOptions(records);

  return (
    <OpenEnrollmentOverview
      cycle={cycle}
      summary={summary}
      records={records}
      analytics={analytics}
      departments={filterOptions.departments}
      plans={filterOptions.planSelections}
      coverageTiers={filterOptions.coverageTiers}
    />
  );
}
