import Link from 'next/link';

import type { MemberAuthorization, MemberMessage } from '@payer-portal/api-contracts';

import { formatCurrency, formatDate } from '../../lib/portal-format';
import { IDCardPreview } from '../member/id-card-preview';
import { PortalSearchForm } from '../portal-search-form';
import { ProgressMeter, StatusBadge } from '../portal-ui';

type CommandCenterProps = {
  claims: ClaimItem[];
  coverageStatus: string;
  deductibleCurrent: number;
  deductibleTotal: number;
  documents: DocumentItem[];
  employerGroupName: string;
  memberId: string;
  memberName: string;
  messages: MemberMessage[];
  outOfPocketCurrent: number;
  outOfPocketTotal: number;
  pcpName: string;
  pendingAuthorizations: MemberAuthorization[];
  planName: string;
  searchBasePath: string;
};

type ClaimItem = {
  claimDate: string;
  claimNumber: string;
  id: string;
  status: string;
  totalAmount: number;
};

type DocumentItem = {
  createdAt: string;
  documentType: string;
  id: string;
  title: string;
};

type ActionItem = {
  description: string;
  href: string;
  label: string;
};

const primaryActions: ActionItem[] = [
  { label: 'View ID Card', href: '/dashboard/id-card', description: 'Open digital ID card details.' },
  { label: 'Find Care', href: '/dashboard/providers', description: 'Search network providers and facilities.' },
  { label: 'Check Claims', href: '/dashboard/claims', description: 'Track claims and payment status.' },
  { label: 'Benefits', href: '/dashboard/benefits', description: 'Review coverage and benefits.' },
  { label: 'Authorizations', href: '/dashboard/authorizations', description: 'See prior authorization updates.' },
  { label: 'Messages', href: '/dashboard/messages', description: 'Open your secure inbox.' }
];

export function MemberCommandCenter({
  claims,
  coverageStatus,
  deductibleCurrent,
  deductibleTotal,
  documents,
  employerGroupName,
  memberId,
  memberName,
  messages,
  outOfPocketCurrent,
  outOfPocketTotal,
  pcpName,
  pendingAuthorizations,
  planName,
  searchBasePath
}: CommandCenterProps) {
  const recentClaim = claims[0];
  const unreadMessages = messages.filter((message) =>
    message.status.toLowerCase().includes('new') ||
    message.status.toLowerCase().includes('unread') ||
    message.status.toLowerCase().includes('pending')
  );
  const reviewClaims = claims.filter((claim) =>
    claim.status.toLowerCase().includes('review') ||
    claim.status.toLowerCase().includes('pending')
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <WelcomePanel
          coverageStatus={coverageStatus}
          employerGroupName={employerGroupName}
          memberName={memberName}
          planName={planName}
        />

        <section className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Coverage snapshot</h2>
          <dl className="mt-4 space-y-3">
            <SnapshotRow label="Coverage" value={coverageStatus} />
            <SnapshotRow label="PCP" value={pcpName} />
            <SnapshotRow label="Member ID" value={memberId} />
            <SnapshotRow label="Plan" value={planName} />
          </dl>
        </section>
      </section>

      <SearchToolsStrip searchBasePath={searchBasePath} />
      <PrimaryActionStrip />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-5">
          <ActionNeededPanel
            pendingAuthorizations={pendingAuthorizations.length}
            reviewClaims={reviewClaims.length}
            unreadMessages={unreadMessages.length}
          />

          <RecentActivityPanel claims={claims} documents={documents} messages={messages} />
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

          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent claim summary</h2>
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

          <section className="portal-card p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Digital ID card preview</h2>
            <IDCardPreview
              planName={planName}
              memberName={memberName}
              memberId={memberId}
              groupNumber={employerGroupName}
              enableQrCode
            />
          </section>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-5">
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

function SearchToolsStrip({ searchBasePath }: { searchBasePath: string }) {
  return (
    <section className="portal-card flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0 xl:w-full xl:max-w-[24rem]">
        <PortalSearchForm searchBasePath={searchBasePath} />
      </div>

      <div className="flex flex-wrap items-center gap-3 xl:ml-auto xl:justify-end">
        <Link
          href="/dashboard/messages"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
        >
          Messages
        </Link>
        <Link
          href="/dashboard/help"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
        >
          Help
        </Link>
      </div>
    </section>
  );
}

function PrimaryActionStrip() {
  return (
    <section className="portal-card p-4" aria-label="Primary member actions">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {primaryActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-4 transition hover:border-[var(--tenant-primary-color)] hover:bg-[var(--tenant-primary-soft-color)]/30"
          >
            <p className="text-sm font-semibold text-[var(--text-primary)]">{action.label}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
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
    <section className="portal-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--tenant-primary-color)]">
        Member command center
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Welcome back, {memberName}</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Employer / Group: {employerGroupName} • Plan: {planName}
      </p>
      <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Coverage status: {coverageStatus}
      </div>
    </section>
  );
}

function ActionNeededPanel({
  pendingAuthorizations,
  reviewClaims,
  unreadMessages
}: {
  pendingAuthorizations: number;
  reviewClaims: number;
  unreadMessages: number;
}) {
  const cards = [
    {
      href: '/dashboard/claims',
      label: 'Claims needing review',
      value: reviewClaims,
      detail: 'Claims with pending or review status.'
    },
    {
      href: '/dashboard/messages',
      label: 'Unread messages',
      value: unreadMessages,
      detail: 'Secure inbox items waiting for response.'
    },
    {
      href: '/dashboard/authorizations',
      label: 'Pending authorizations',
      value: pendingAuthorizations,
      detail: 'Authorizations with active workflow status.'
    }
  ];

  return (
    <section className="portal-card p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Action needed</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 py-3 transition hover:border-[var(--tenant-primary-color)]"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{card.value}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{card.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentActivityPanel({
  claims,
  documents,
  messages
}: {
  claims: ClaimItem[];
  documents: DocumentItem[];
  messages: MemberMessage[];
}) {
  const events = [
    ...claims.slice(0, 2).map((claim) => ({
      id: claim.id,
      label: `Claim ${claim.claimNumber}`,
      detail: `${claim.status} • ${formatCurrency(claim.totalAmount)}`,
      timestamp: claim.claimDate
    })),
    ...messages.slice(0, 2).map((message) => ({
      id: message.id,
      label: `Message: ${message.subject}`,
      detail: message.status,
      timestamp: message.createdAt
    })),
    ...documents.slice(0, 2).map((document) => ({
      id: document.id,
      label: `Document: ${document.title}`,
      detail: document.documentType,
      timestamp: document.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <section className="portal-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent activity</h2>
        <Link href="/dashboard/claims" className="text-sm font-semibold text-[var(--tenant-primary-color)]">
          View all
        </Link>
      </div>

      {events.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-[var(--border-subtle)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{event.label}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{event.detail}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(event.timestamp)}</p>
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
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--text-primary)]">{value}</dd>
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
      className="portal-card block p-4 transition hover:border-[var(--tenant-primary-color)]"
    >
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{detail}</p>
    </Link>
  );
}
