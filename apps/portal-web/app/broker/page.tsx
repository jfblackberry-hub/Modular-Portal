import { BrokerCommandCenterDashboard } from '../../components/billing-enrollment/BrokerCommandCenterDashboard';
import { getBrokerCases, getBrokerCommissionsSummary } from '../../lib/broker-operations-data';
import { resolveBrokerPersona } from '../../lib/broker-portal-config';
import { getBrokerCommandCenterData } from '../../lib/broker-sales-workspace-data';
import { getPortalSessionUser } from '../../lib/portal-session';

export default async function BrokerPortalHomePage() {
  const sessionUser = await getPortalSessionUser();
  const persona = resolveBrokerPersona({
    roles: sessionUser?.roles ?? []
  });
  const brokerName = `${sessionUser?.firstName ?? 'Avery'} ${sessionUser?.lastName ?? 'Lee'}`;
  const snapshot = getBrokerCommandCenterData();
  const cases = getBrokerCases();
  const commissionSummary = getBrokerCommissionsSummary();

  return (
    <BrokerCommandCenterDashboard
      agencyName={sessionUser?.tenant.name ?? 'Riverside Benefits Group'}
      brokerName={brokerName}
      personaLabel={persona.label}
      canManage={persona.canManage}
      primaryActionLabel={persona.dashboardCtaLabel}
      kpis={{
        ...snapshot.kpis,
        pendingTasks: cases.filter((item) => item.status !== 'Resolved').length,
        mtdCommissions: commissionSummary.total
      }}
      renewalsNeedingAction={snapshot.renewalsNeedingAction}
      openQuotes={snapshot.openQuotes}
      enrollmentIssues={snapshot.enrollmentIssues}
      recentActivity={snapshot.recentActivity}
      commissionSnapshot={{
        mtdCommissions: commissionSummary.total,
        postedGroups: commissionSummary.byGroup.length - commissionSummary.exceptions.length,
        exceptions: commissionSummary.exceptions.length,
        pendingValue: commissionSummary.pending
      }}
      alerts={snapshot.alerts}
      tasks={cases
        .filter((item) => item.status !== 'Resolved')
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          groupId: item.groupId ?? 'broker-case',
          title: item.title,
          detail: item.summary,
          status: item.status,
          dueDate: item.dueDate,
          href: item.renewalId
            ? `/broker/renewals/${item.renewalId}`
            : item.quoteId
              ? `/broker/quotes/${item.quoteId}`
              : item.groupId
                ? `/broker/book-of-business/${item.groupId}`
                : '/broker/tasks',
          category: 'document'
        }))}
    />
  );
}
