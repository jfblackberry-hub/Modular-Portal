import { EmployerCommandCenterDashboard } from '../../components/billing-enrollment/EmployerCommandCenterDashboard';
import { getPortalSessionUser } from '../../lib/portal-session';

export default async function EmployerPortalHomePage() {
  const sessionUser = await getPortalSessionUser();

  return (
    <EmployerCommandCenterDashboard
      mode="live"
      employerName={sessionUser?.tenant.name ?? 'Employer'}
      tenantId={sessionUser?.tenant.id ?? 'unknown-tenant'}
    />
  );
}
