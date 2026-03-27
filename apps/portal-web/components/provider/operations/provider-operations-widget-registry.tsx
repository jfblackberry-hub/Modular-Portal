'use client';

import type {
  ProviderOperationsDashboardContract,
  ProviderOperationsWidgetTone
} from '@payer-portal/api-contracts';

import type { PortalSessionUser } from '../../../lib/portal-session';
import { useProviderOperationsLiveDashboard } from '../../../lib/use-provider-operations-live-dashboard';
import {
  AttentionStrip,
  CommandCenterHero,
  CommandCenterShell,
  type PriorityBriefRow
} from './provider-command-center-ui';

function toneFromStatus(status: string): ProviderOperationsWidgetTone {
  if (/denied|expired|open_slot|at_risk|pending_resubmission/i.test(status)) {
    return 'danger';
  }

  if (/due_soon|low_visits|pending|in_review|documentation_needed/i.test(status)) {
    return 'warning';
  }

  if (/paid|active|ready|confirmed|resubmitted/i.test(status)) {
    return 'success';
  }

  return 'info';
}

function normalizeProviderWorkspaceHref(href: string) {
  if (!href.startsWith('/provider/dashboard?')) {
    return href;
  }

  const url = new URL(href, 'http://provider.local');
  const detail = url.searchParams.get('detail');
  const filter = url.searchParams.get('filter');
  const params = new URLSearchParams();

  if (filter && filter !== 'all') {
    params.set('filter', filter);
  }

  const query = params.toString();

  switch (detail) {
    case 'scheduling':
      return query ? `/provider/scheduling?${query}` : '/provider/scheduling';
    case 'authorizations':
      return query ? `/provider/authorizations?${query}` : '/provider/authorizations';
    case 'utilization':
      return query ? `/provider/utilization?${query}` : '/provider/utilization';
    case 'claims':
      return query ? `/provider/claims?${query}` : '/provider/claims';
    default:
      return '/provider/dashboard';
  }
}

function buildPriorityBriefRows(dashboard: ProviderOperationsDashboardContract): PriorityBriefRow[] {
  const eligibilitySession = dashboard.scheduling.sessions.find((session) =>
    session.issueFlags.some((flag) => /eligibility/i.test(flag))
  );
  const documentationSession = dashboard.scheduling.sessions.find(
    (session) => session.status === 'documentation_needed'
  );
  const openCoverageSession = dashboard.scheduling.sessions.find(
    (session) => session.status === 'open_slot'
  );
  const dueSoonAuthorization = dashboard.authorizations.authorizations.find(
    (authorization) => authorization.status === 'due_soon' || authorization.status === 'low_visits'
  );
  const pendingAuthorization = dashboard.authorizations.authorizations.find(
    (authorization) => authorization.status === 'pending'
  );
  const claimNeedingWork = dashboard.claims.claims.find(
    (claim) => claim.status === 'denied' || claim.status === 'pending_resubmission'
  );

  return [
    eligibilitySession
      ? {
          title: `Verify ${eligibilitySession.patientName} eligibility before ${eligibilitySession.startTime}`,
          why: `Coverage is still unconfirmed for the ${eligibilitySession.setting} session and today’s visit may not be billable.`,
          action: 'Run eligibility check and confirm active coverage before arrival.',
          href: '/provider/eligibility?filter=priority'
        }
      : null,
    documentationSession
      ? {
          title: `Finish ${documentationSession.patientName} documentation package`,
          why: 'Claim submission stays blocked until the missing session note and supervision record are complete.',
          action: 'Request the missing note and attach the supervision record today.',
          href: '/provider/scheduling?filter=at_risk'
        }
      : null,
    dueSoonAuthorization
      ? {
          title: `Review ${dueSoonAuthorization.patientName} visits remaining`,
          why: `Only ${dueSoonAuthorization.remainingVisits} visits remain and ${dueSoonAuthorization.upcomingScheduledSessions} scheduled sessions could be affected next.`,
          action: 'Confirm remaining units and prepare the extension request today.',
          href: '/provider/authorizations?filter=low_visits'
        }
      : null,
    claimNeedingWork
      ? {
          title: `Clear ${claimNeedingWork.patientName} claim blocker`,
          why: `${claimNeedingWork.denialReason ?? 'Claim status'} is holding up payment for the ${claimNeedingWork.dateOfService} service date.`,
          action: claimNeedingWork.status === 'pending_resubmission'
            ? 'Finish the missing documentation and move the correction back into resubmission.'
            : 'Correct the known issue and restart the resubmission workflow.',
          href: '/provider/claims?filter=resubmission'
        }
      : null,
    openCoverageSession
      ? {
          title: `Backfill ${openCoverageSession.patientName} coverage gap`,
          why: `The ${openCoverageSession.startTime} session is still open after a same-day cancellation and the family needs a staffing update.`,
          action: 'Review available coverage and assign the best replacement slot.',
          href: '/provider/scheduling?filter=open_slot'
        }
      : null,
    pendingAuthorization
      ? {
          title: `Advance ${pendingAuthorization.patientName} auth follow-up`,
          why: `The request is still pending and ${pendingAuthorization.upcomingScheduledSessions} upcoming sessions depend on that decision landing on time.`,
          action: 'Confirm payer receipt and upload any missing intake summary today.',
          href: '/provider/authorizations?filter=pending'
        }
      : null,
  ].filter((row): row is PriorityBriefRow => Boolean(row));
}

export function ProviderOperationsDashboard({
  clinicName,
  dashboard,
  providerName,
  user
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
  providerName: string;
  user: PortalSessionUser;
}) {
  const { dashboard: liveDashboard } = useProviderOperationsLiveDashboard(dashboard);

  const heroStats = [
    liveDashboard.scheduling.metrics[0],
    liveDashboard.authorizations.metrics[1] ?? liveDashboard.authorizations.metrics[0],
    liveDashboard.claims.metrics[4] ?? liveDashboard.claims.metrics[2]
  ]
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric))
    .map((metric) => ({
      label: metric.label,
      value: metric.value,
      detail: metric.detail
    }));
  const priorityBriefRows = buildPriorityBriefRows(liveDashboard).map((row) => ({
    ...row,
    href: normalizeProviderWorkspaceHref(row.href)
  }));
  const attentionItems = liveDashboard.attentionItems.map((item) => ({
    ...item,
    href: normalizeProviderWorkspaceHref(item.href)
  }));

  return (
    <CommandCenterShell>
      <CommandCenterHero
        alertCount={liveDashboard.alertsCount}
        clinicName={clinicName}
        briefRows={priorityBriefRows}
        providerName={providerName}
        stats={heroStats}
      />

      <AttentionStrip items={attentionItems} />
    </CommandCenterShell>
  );
}
