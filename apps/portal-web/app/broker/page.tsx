import { BrokerCommandCenterDashboard } from '../../components/billing-enrollment/BrokerCommandCenterDashboard';
import { resolveBrokerPersona } from '../../lib/broker-portal-config';
import { getBrokerCommandCenterSummary } from '../../lib/broker-sales-workspace-data';
import { getPortalSessionUser } from '../../lib/portal-session';
import { buildPortalWorkspaceSessionKey } from '../../lib/portal-workspace-session';

export default async function BrokerPortalHomePage() {
  const sessionUser = await getPortalSessionUser();
  const persona = resolveBrokerPersona({
    roles: sessionUser?.roles ?? []
  });
  const brokerAgencyName =
    typeof sessionUser?.tenant.brandingConfig?.brokerAgencyName === 'string'
      ? sessionUser.tenant.brandingConfig.brokerAgencyName
      : 'Northbridge Benefits Group';
  const brokerName = `${sessionUser?.firstName ?? 'Avery'} ${sessionUser?.lastName ?? 'Lee'}`;
  const summary = getBrokerCommandCenterSummary();
  const workspaceSessionKey = buildPortalWorkspaceSessionKey({
    portal: 'broker',
    user: sessionUser
  });

  return (
    <BrokerCommandCenterDashboard
      agencyName={brokerAgencyName}
      brokerName={brokerName}
      personaLabel={persona.label}
      canManage={persona.canManage}
      primaryActionLabel={persona.dashboardCtaLabel}
      kpis={summary.kpis}
      sessionScopeKey={workspaceSessionKey}
    />
  );
}
