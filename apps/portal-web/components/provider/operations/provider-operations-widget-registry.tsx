'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  ProviderOperationsAuthorizationRecord,
  ProviderOperationsClaimRecord,
  ProviderOperationsDashboardContract,
  ProviderOperationsSessionRecord,
  ProviderOperationsUtilizationRecord,
  ProviderOperationsWidgetTone
} from '@payer-portal/api-contracts';

import type { PortalSessionUser } from '../../../lib/portal-session';
import { useProviderOperationsLiveDashboard } from '../../../lib/use-provider-operations-live-dashboard';
import {
  AttentionStrip,
  CommandCenterHero,
  CommandCenterShell,
  DetailDrawer,
  type PriorityBriefRow,
  SummaryMetricGrid,
  ToneBadge
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

function openFilter(searchParams: URLSearchParams, detail: string, filter: string) {
  const next = new URLSearchParams(searchParams.toString());
  next.set('detail', detail);
  next.set('filter', filter);
  return next.toString();
}

function filterSessions(records: ProviderOperationsSessionRecord[], filter: string | null) {
  switch (filter) {
    case 'open_slot':
      return records.filter((record) => record.status === 'open_slot');
    case 'cancellations':
      return records.filter((record) =>
        record.issueFlags.some((flag) => /cancellation/i.test(flag))
      );
    case 'eligibility_missing':
      return records.filter((record) =>
        record.issueFlags.some((flag) => /eligibility/i.test(flag))
      );
    case 'at_risk':
      return records.filter((record) =>
        record.status === 'at_risk' ||
        record.status === 'documentation_needed' ||
        record.issueFlags.some((flag) => /auth|coverage|unsigned|eligibility/i.test(flag))
      );
    default:
      return records;
  }
}

function filterAuthorizations(
  records: ProviderOperationsAuthorizationRecord[],
  filter: string | null
) {
  switch (filter) {
    case 'due_soon':
      return records.filter((record) => record.status === 'due_soon');
    case 'expired':
      return records.filter((record) => record.status === 'expired');
    case 'low_visits':
      return records.filter((record) => record.status === 'low_visits' || record.remainingVisits <= 4);
    case 'pending':
      return records.filter((record) => record.status === 'pending');
    case 'denied':
      return records.filter((record) => record.status === 'denied');
    case 'active':
      return records.filter((record) => record.status === 'active');
    default:
      return records;
  }
}

function filterClaims(records: ProviderOperationsClaimRecord[], filter: string | null) {
  switch (filter) {
    case 'submitted':
      return records.filter((record) => record.status === 'submitted');
    case 'pending':
      return records.filter((record) =>
        record.status === 'submitted' || record.status === 'in_review'
      );
    case 'denied':
      return records.filter((record) => record.status === 'denied');
    case 'resubmission':
      return records.filter((record) =>
        record.status === 'pending_resubmission' || record.status === 'resubmitted'
      );
    case 'at_risk':
      return records.filter((record) =>
        record.status === 'denied' || record.status === 'pending_resubmission'
      );
    default:
      return records;
  }
}

function filterUtilization(
  records: ProviderOperationsUtilizationRecord[],
  filter: string | null
) {
  switch (filter) {
    case 'underutilized':
      return records.filter((record) => record.utilizationPercent < 70);
    case 'overloaded':
      return records.filter((record) => record.utilizationPercent > 95);
    case 'coverage_gaps':
      return records.filter((record) => record.openCoverageGaps > 0);
    default:
      return records;
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
          href: '/provider/dashboard?detail=scheduling&filter=eligibility_missing'
        }
      : null,
    documentationSession
      ? {
          title: `Finish ${documentationSession.patientName} documentation package`,
          why: 'Claim submission stays blocked until the missing session note and supervision record are complete.',
          action: 'Request the missing note and attach the supervision record today.',
          href: '/provider/dashboard?detail=scheduling&filter=at_risk'
        }
      : null,
    dueSoonAuthorization
      ? {
          title: `Review ${dueSoonAuthorization.patientName} visits remaining`,
          why: `Only ${dueSoonAuthorization.remainingVisits} visits remain and ${dueSoonAuthorization.upcomingScheduledSessions} scheduled sessions could be affected next.`,
          action: 'Confirm remaining units and prepare the extension request today.',
          href: '/provider/dashboard?detail=authorizations&filter=low_visits'
        }
      : null,
    claimNeedingWork
      ? {
          title: `Clear ${claimNeedingWork.patientName} claim blocker`,
          why: `${claimNeedingWork.denialReason ?? 'Claim status'} is holding up payment for the ${claimNeedingWork.dateOfService} service date.`,
          action: claimNeedingWork.status === 'pending_resubmission'
            ? 'Finish the missing documentation and move the correction back into resubmission.'
            : 'Correct the known issue and restart the resubmission workflow.',
          href: '/provider/dashboard?detail=claims&filter=resubmission'
        }
      : null,
    openCoverageSession
      ? {
          title: `Backfill ${openCoverageSession.patientName} coverage gap`,
          why: `The ${openCoverageSession.startTime} session is still open after a same-day cancellation and the family needs a staffing update.`,
          action: 'Review available coverage and assign the best replacement slot.',
          href: '/provider/dashboard?detail=scheduling&filter=open_slot'
        }
      : null,
    pendingAuthorization
      ? {
          title: `Advance ${pendingAuthorization.patientName} auth follow-up`,
          why: `The request is still pending and ${pendingAuthorization.upcomingScheduledSessions} upcoming sessions depend on that decision landing on time.`,
          action: 'Confirm payer receipt and upload any missing intake summary today.',
          href: '/provider/dashboard?detail=authorizations&filter=pending'
        }
      : null,
  ].filter((row): row is PriorityBriefRow => Boolean(row));
}

function ScheduleRows({
  rows
}: {
  rows: ProviderOperationsSessionRecord[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {row.patientName}
                </p>
                <ToneBadge label={row.status.replaceAll('_', ' ')} tone={toneFromStatus(row.status)} />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                  {row.setting}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {row.caseName} • {row.therapistName} • {row.supervisingClinicianName}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {row.organizationUnitName} • {row.startTime} - {row.endTime}
              </p>
              <div className="flex flex-wrap gap-2">
                {row.issueFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[var(--text-secondary)] lg:min-w-[220px]">
              <p className="font-semibold text-[var(--text-primary)]">Next action</p>
              <p className="mt-2">{row.nextAction}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AuthorizationRows({
  rows
}: {
  rows: ProviderOperationsAuthorizationRecord[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-4"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {row.patientName}
                </p>
                <ToneBadge label={row.status.replaceAll('_', ' ')} tone={toneFromStatus(row.status)} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {row.caseName} • {row.organizationUnitName} • {row.payerName}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Therapist: {row.therapistName} • Supervisor: {row.supervisingClinicianName}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {row.startDate} to {row.endDate} • {row.remainingVisits} visits remaining • {row.upcomingScheduledSessions} scheduled
              </p>
            </div>
            <div className="grid gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-[var(--text-secondary)] xl:min-w-[260px]">
              <p><span className="font-semibold text-[var(--text-primary)]">Follow-up:</span> {row.followUpStatus}</p>
              <p><span className="font-semibold text-[var(--text-primary)]">Notes / Docs:</span> {row.noteCount} notes • {row.documentCount} docs</p>
              <p><span className="font-semibold text-[var(--text-primary)]">Next action:</span> {row.nextAction}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function UtilizationRows({
  rows
}: {
  rows: ProviderOperationsUtilizationRecord[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {row.therapistName}
                </p>
                <ToneBadge label={`${row.utilizationPercent}% utilized`} tone={row.tone} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {row.organizationUnitName} • {row.roleLabel} • {row.scheduledSessions}/{row.weeklyCapacity} sessions booked
              </p>
            </div>
            <div className="grid gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-[var(--text-secondary)] lg:min-w-[280px]">
              <p><span className="font-semibold text-[var(--text-primary)]">Open gaps:</span> {row.openCoverageGaps}</p>
              <p><span className="font-semibold text-[var(--text-primary)]">At-risk sessions:</span> {row.atRiskSessions}</p>
              <p><span className="font-semibold text-[var(--text-primary)]">Next action:</span> {row.nextAction}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ClaimsRows({
  rows
}: {
  rows: ProviderOperationsClaimRecord[];
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-4"
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {row.id.toUpperCase()}
                </p>
                <ToneBadge label={row.status.replaceAll('_', ' ')} tone={toneFromStatus(row.status)} />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {row.patientName} • {row.caseName} • Therapist: {row.therapistName}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                DOS {row.dateOfService} • {row.payerName} • ${row.amount.toLocaleString()}
              </p>
              {row.denialReason ? (
                <p className="mt-1 text-sm text-rose-700">
                  Denial reason: {row.denialReason}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-[var(--text-secondary)] xl:min-w-[280px]">
              <p><span className="font-semibold text-[var(--text-primary)]">Age:</span> {row.ageInDays} days</p>
              <p><span className="font-semibold text-[var(--text-primary)]">Resubmission:</span> {row.resubmissionStatus ?? 'Not needed'}</p>
              <p><span className="font-semibold text-[var(--text-primary)]">Next action:</span> {row.nextAction}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function DrilldownBody({
  dashboard,
  detail,
  filter
}: {
  dashboard: ProviderOperationsDashboardContract;
  detail: string;
  filter: string | null;
}) {
  if (detail === 'scheduling') {
    return (
      <div className="space-y-5">
        <SummaryMetricGrid metrics={dashboard.scheduling.metrics} />
        <ScheduleRows rows={filterSessions(dashboard.scheduling.sessions, filter)} />
      </div>
    );
  }

  if (detail === 'authorizations') {
    return (
      <div className="space-y-5">
        <SummaryMetricGrid metrics={dashboard.authorizations.metrics} />
        <AuthorizationRows rows={filterAuthorizations(dashboard.authorizations.authorizations, filter)} />
      </div>
    );
  }

  if (detail === 'utilization') {
    return (
      <div className="space-y-5">
        <SummaryMetricGrid metrics={dashboard.utilization.metrics} />
        <UtilizationRows rows={filterUtilization(dashboard.utilization.therapists, filter)} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SummaryMetricGrid metrics={dashboard.claims.metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <ClaimsRows rows={filterClaims(dashboard.claims.claims, filter)} />
        <section className="tenant-action-panel space-y-4 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Claims pipeline</p>
            <div className="mt-3 space-y-2">
              {dashboard.claims.pipeline.map((entry) => (
                <div key={entry.status} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                  <span className="text-[var(--text-secondary)]">{entry.label}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Top denial reasons</p>
            <div className="mt-3 space-y-2">
              {dashboard.claims.denialReasons.map((entry) => (
                <div key={entry.reason} className="rounded-xl bg-white px-3 py-3 text-sm">
                  <p className="font-semibold text-[var(--text-primary)]">{entry.reason}</p>
                  <p className="mt-1 text-[var(--text-secondary)]">
                    {entry.count} claims • ${entry.amountAtRisk.toLocaleString()} at risk
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dashboard: liveDashboard } = useProviderOperationsLiveDashboard(dashboard);
  const detail = searchParams.get('detail');
  const filter = searchParams.get('filter');

  function closeDrawer() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('detail');
    next.delete('filter');
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }

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
  const priorityBriefRows = buildPriorityBriefRows(liveDashboard);

  return (
    <CommandCenterShell>
      <CommandCenterHero
        alertCount={liveDashboard.alertsCount}
        clinicName={clinicName}
        briefRows={priorityBriefRows}
        providerName={providerName}
        stats={heroStats}
      />

      <AttentionStrip items={liveDashboard.attentionItems} />

      {detail ? (
        <DetailDrawer
          onClose={closeDrawer}
          title={`${detail[0]?.toUpperCase()}${detail.slice(1)} drill-down`}
        >
          <DrilldownBody dashboard={liveDashboard} detail={detail} filter={filter} />
        </DetailDrawer>
      ) : null}
    </CommandCenterShell>
  );
}
