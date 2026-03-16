import { EmployerBillingOverview } from '../../../../components/billing-enrollment/EmployerBillingOverview';
import { getEmployerDashboard } from '../../../../lib/billing-enrollment-api';
import { getEmployerBillingDatasetForTenant } from '../../../../lib/employer-billing-data';
import { getPortalSessionUser } from '../../../../lib/portal-session';

export default async function EmployerBillingOverviewPage() {
  const user = await getPortalSessionUser();
  const tenantId = user?.tenant.id ?? 'unknown-tenant';
  const employerName = user?.tenant.name ?? 'Employer';
  const dashboard = user ? await getEmployerDashboard(user.id).catch(() => null) : null;

  const dataset = getEmployerBillingDatasetForTenant(tenantId, employerName, dashboard?.billingSummary);

  return <EmployerBillingOverview dataset={dataset} />;
}
