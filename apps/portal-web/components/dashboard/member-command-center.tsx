import Link from 'next/link';

import { formatCurrency, formatDate } from '../../lib/portal-format';
import { MemberDashboardWorkspaceSection } from '../member/dashboard-workspaces/MemberDashboardWorkspaceSection';
import { ProgressMeter, StatusBadge } from '../portal-ui';

type CommandCenterProps = {
  coverageStatus: string;
  deductibleCurrent: number;
  deductibleTotal: number;
  employerGroupName: string;
  memberId: string;
  memberName: string;
  outOfPocketCurrent: number;
  outOfPocketTotal: number;
  pcpName: string;
  planName: string;
  recentClaims?: ClaimItem[];
  workspaceSessionKey: string;
};

type ClaimItem = {
  claimDate: string;
  claimNumber: string;
  id: string;
  status: string;
  totalAmount: number;
};

export function MemberCommandCenter({
  coverageStatus,
  deductibleCurrent,
  deductibleTotal,
  employerGroupName,
  memberId,
  memberName,
  outOfPocketCurrent,
  outOfPocketTotal,
  pcpName,
  planName,
  recentClaims = [],
  workspaceSessionKey
}: CommandCenterProps) {
  const recentClaim = recentClaims[0];
  const reviewClaims = recentClaims.filter((claim) =>
    claim.status.toLowerCase().includes('review') ||
    claim.status.toLowerCase().includes('pending')
  );

  return (
    <div className="space-y-5">
      <section className="member-command-grid grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <WelcomePanel
          coverageStatus={coverageStatus}
          employerGroupName={employerGroupName}
          memberName={memberName}
          planName={planName}
        />

        <section className="member-panel member-panel--snapshot portal-card p-5">
          <h2 className="member-panel__title text-lg font-semibold text-[var(--text-primary)]">Coverage snapshot</h2>
          <dl className="member-panel__body mt-4 space-y-3">
            <SnapshotRow label="Coverage" value={coverageStatus} />
            <SnapshotRow label="PCP" value={pcpName} />
            <SnapshotRow label="Member ID" value={memberId} />
            <SnapshotRow label="Plan" value={planName} />
          </dl>
        </section>
      </section>
      <MemberDashboardWorkspaceSection sessionScopeKey={workspaceSessionKey} />

      <section className="member-command-grid grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-5">
          <ActionNeededPanel reviewClaims={reviewClaims.length} />

          <RecentActivityPanel claims={recentClaims} />
        </div>

        <div className="space-y-5">
          <ProgressMeter
            label="Deductible progress"
            current={deductibleCurrent}
            total={deductibleTotal}
            helper="In-network deductible used this plan year"
          />

          <ProgressMeter
            label="Out-of-pocket progress"
            current={outOfPocketCurrent}
            total={outOfPocketTotal}
            helper="Out-of-pocket accumulation toward annual maximum"
          />

          <section className="member-panel member-panel--claim-summary portal-card p-5">
            <h2 className="member-panel__title text-lg font-semibold text-[var(--text-primary)]">Recent claim summary</h2>
            {recentClaim ? (
              <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)]">{recentClaim.claimNumber}</p>
                <p>{formatDate(recentClaim.claimDate)}</p>
                <p>{formatCurrency(recentClaim.totalAmount)}</p>
                <StatusBadge label={recentClaim.status} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">No recent claims available.</p>
            )}
          </section>
        </div>
      </section>

      <section className="member-support-grid grid gap-4 lg:grid-cols-2 2xl:grid-cols-5">
        <SupportTile
          href="/dashboard/benefits"
          title="My Plan"
          detail="Coverage details, copays, and benefit highlights."
        />
        <SupportTile
          href="/dashboard/billing"
          title="Dependents"
          detail="Review covered household members and status."
        />
        <SupportTile
          href="/dashboard/documents"
          title="Documents"
          detail="Benefit guides, EOBs, and notices in one place."
        />
        <SupportTile
          href="/dashboard/help"
          title="Preventive care"
          detail="See reminders for annual exams and screenings."
        />
        <SupportTile
          href="/dashboard/help"
          title="Quick links"
          detail="Support, accessibility, language, and contacts."
        />
      </section>
    </div>
  );
}

function WelcomePanel({
  coverageStatus,
  employerGroupName,
  memberName,
  planName
}: {
  coverageStatus: string;
  employerGroupName: string;
  memberName: string;
  planName: string;
}) {
  return (
    <section className="member-panel member-panel--welcome portal-card p-6">
      <p className="member-panel__eyebrow text-xs font-semibold uppercase tracking-[0.15em] text-[var(--tenant-primary-color)]">
        Member command center
      </p>
      <h1 className="member-panel__headline mt-2 text-3xl font-semibold text-[var(--text-primary)]">Welcome back, {memberName}</h1>
      <p className="member-panel__subcopy mt-3 text-sm text-[var(--text-secondary)]">
        Employer / Group: {employerGroupName} • Plan: {planName}
      </p>
      <div className="member-panel__status mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Coverage status: {coverageStatus}
      </div>
    </section>
  );
}

function ActionNeededPanel({
  reviewClaims
}: {
  reviewClaims: number;
}) {
  const cards = [
    {
      href: '/dashboard/claims',
      label: 'Claims needing review',
      value: reviewClaims,
      detail: 'Claims with pending or review status.'
    },
    {
      href: '/dashboard/authorizations',
      label: 'Authorization workspace',
      value: 1,
      detail: 'Open the authorization workspace to review current requests.'
    }
  ];

  return (
    <section className="member-panel member-panel--action-needed portal-card p-5">
      <h2 className="member-panel__title text-lg font-semibold text-[var(--text-primary)]">Action needed</h2>
      <div className="member-panel__actions mt-4 grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="member-action-card rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 py-3 transition hover:border-[var(--tenant-primary-color)]"
          >
            <p className="member-action-card__label text-xs uppercase tracking-wide text-[var(--text-muted)]">{card.label}</p>
            <p className="member-action-card__value mt-2 text-2xl font-semibold text-[var(--text-primary)]">{card.value}</p>
            <p className="member-action-card__detail mt-1 text-xs text-[var(--text-secondary)]">{card.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentActivityPanel({
  claims
}: {
  claims: ClaimItem[];
}) {
  const events = [
    ...claims.slice(0, 2).map((claim) => ({
      id: `claim:${claim.id}`,
      label: `Claim ${claim.claimNumber}`,
      detail: `${claim.status} • ${formatCurrency(claim.totalAmount)}`,
      timestamp: claim.claimDate
    }))
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <section className="member-panel member-panel--recent-activity portal-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="member-panel__title text-lg font-semibold text-[var(--text-primary)]">Recent activity</h2>
        <Link href="/dashboard/claims" className="member-panel__link text-sm font-semibold text-[var(--tenant-primary-color)]">
          View all
        </Link>
      </div>

      {events.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {events.map((event) => (
            <li key={event.id} className="member-activity-item rounded-xl border border-[var(--border-subtle)] px-4 py-3">
              <p className="member-activity-item__label text-sm font-semibold text-[var(--text-primary)]">{event.label}</p>
              <p className="member-activity-item__detail mt-1 text-xs text-[var(--text-secondary)]">{event.detail}</p>
              <p className="member-activity-item__timestamp mt-1 text-xs text-[var(--text-muted)]">{formatDate(event.timestamp)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">No activity yet for this account.</p>
      )}
    </section>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="member-snapshot-row flex items-center justify-between gap-4 text-sm">
      <dt className="member-snapshot-row__label text-[var(--text-secondary)]">{label}</dt>
      <dd className="member-snapshot-row__value text-right font-semibold text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function SupportTile({
  detail,
  href,
  title
}: {
  detail: string;
  href: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="member-support-tile portal-card block p-4 transition hover:border-[var(--tenant-primary-color)]"
    >
      <h3 className="member-support-tile__title text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="member-support-tile__detail mt-2 text-sm text-[var(--text-secondary)]">{detail}</p>
    </Link>
  );
}
