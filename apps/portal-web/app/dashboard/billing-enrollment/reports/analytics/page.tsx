import { ReportsAnalyticsDashboard } from '../../../../../components/billing-enrollment/ReportsAnalyticsDashboard';
import { getPortalSessionUser } from '../../../../../lib/portal-session';
import { getAnalyticsDatasetForTenant } from '../../../../../lib/reports-analytics-data';

export default async function ReportsAnalyticsPage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return <ReportsAnalyticsDashboard dataset={getAnalyticsDatasetForTenant(tenantId)} />;
}
