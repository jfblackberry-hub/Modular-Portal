import { ReportsScheduleManager } from '../../../../../components/billing-enrollment/ReportsScheduleManager';
import {
  getScheduledReportsForTenant,
  reportDefinitions
} from '../../../../../lib/reports-analytics-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

export default async function ReportsSchedulePage() {
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';

  return (
    <ReportsScheduleManager
      schedules={getScheduledReportsForTenant(tenantId)}
      reportDefinitions={reportDefinitions}
    />
  );
}
