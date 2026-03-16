import { ReportsAnalyticsDashboard } from '../../../../../components/billing-enrollment/ReportsAnalyticsDashboard';
import { getAnalyticsDatasetForTenant } from '../../../../../lib/reports-analytics-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function ReportsAnalyticsPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return <ReportsAnalyticsDashboard dataset={getAnalyticsDatasetForTenant(tenantId)} />;
}
