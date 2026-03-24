import { EmployerCommandCenterDashboard } from '../../components/billing-enrollment/EmployerCommandCenterDashboard';
import { getPortalSessionUser } from '../../lib/portal-session';
import { buildPortalWorkspaceSessionKey } from '../../lib/portal-workspace-session';

export default async function EmployerPortalHomePage() {
  const sessionUser = await getPortalSessionUser();
  const workspaceSessionKey = buildPortalWorkspaceSessionKey({
    portal: 'employer',
    user: sessionUser
  });

  return (
    <EmployerCommandCenterDashboard
      mode="live"
      employerName={sessionUser?.tenant.name ?? 'Employer'}
      workspaceSessionKey={workspaceSessionKey}
    />
  );
}
