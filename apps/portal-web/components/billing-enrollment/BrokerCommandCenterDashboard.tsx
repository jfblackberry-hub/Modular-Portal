'use client';

import Link from 'next/link';

import { getTimeOfDayGreeting } from '../../lib/get-time-of-day-greeting';
import type { BrokerAlert, BrokerGroup, BrokerTask } from '../../lib/broker-portfolio-data';
import type { BrokerQuote, BrokerRenewal } from '../../lib/broker-sales-workspace-data';
import { InlineButton, PageHeader, StatCard, StatusBadge, SupportLink, SurfaceCard } from '../portal-ui';
import { BrokerWorkflowStatusBadge } from './BrokerWorkflowStatusBadge';

type BrokerCommandCenterDashboardProps = {
  agencyName: string;
  brokerName: string;
  personaLabel: string;
  canManage: boolean;
  primaryActionLabel: string;
  kpis: {
    assignedGroups: number;
    renewalsDue: number;
    openQuotes: number;
    enrollmentsInProgress: number;
    pendingTasks: number;
    mtdCommissions: number;
  };
  renewalsNeedingAction: BrokerRenewal[];
  openQuotes: BrokerQuote[];
  enrollmentIssues: BrokerGroup[];
  recentActivity: Array<{
    date: string;
    actor: string;
    type: string;
    description: string;
    groupId: string;
    groupName: string;
  }>;
  commissionSnapshot: {
    mtdCommissions: number;
    postedGroups: number;
    exceptions: number;
    pendingValue: number;
  };
  alerts: BrokerAlert[];
  tasks: BrokerTask[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatShortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function BrokerCommandCenterDashboard({
  agencyName,
  brokerName,
  personaLabel,
  canManage,
  primaryActionLabel,
  kpis,
  renewalsNeedingAction,
  openQuotes,
  enrollmentIssues,
  recentActivity,
  commissionSnapshot,
  alerts,
  tasks
}: BrokerCommandCenterDashboardProps) {
  const greeting = getTimeOfDayGreeting(new Date());
  const heroDescription = `${agencyName} portfolio view for ${personaLabel.toLowerCase()} operations. Track renewal exposure, open quotes, enrollment blockers, and commission activity across your assigned groups.`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title={`${greeting}, ${brokerName}`}
        description={heroDescription}
        actions={
          <>
          <InlineButton href="/broker/book-of-business" tone="secondary">
            Review assigned groups
          </InlineButton>
            <InlineButton href={canManage ? '/broker/tasks' : '/broker/support'}>
              {primaryActionLabel}
            </InlineButton>
          </>
        }
      />

      <section className="portal-card p-4" aria-label="Broker quick actions">
        <div className="flex flex-wrap gap-3">
          <InlineButton href="/broker/quotes/new">Start Quote</InlineButton>
          <InlineButton href="/broker/documents" tone="secondary">
            Upload Census
          </InlineButton>
          <InlineButton href="/broker/renewals" tone="secondary">
            Review Renewals
          </InlineButton>
          <InlineButton href="/broker/commissions" tone="secondary">
            View Commissions
          </InlineButton>
          <InlineButton href="/broker/documents" tone="secondary">
            Open Documents
          </InlineButton>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Broker KPI summary">
        <StatCard
          label="Assigned Groups"
          value={kpis.assignedGroups.toString()}
          detail="Employer groups currently assigned in your active book of business."
          tone="info"
        />
        <StatCard
          label="Renewals Due"
          value={kpis.renewalsDue.toString()}
          detail="Groups with renewal activity landing inside the next 120 days."
          tone="warning"
        />
        <StatCard
          label="Open Quotes"
          value={kpis.openQuotes.toString()}
          detail="Prospects or incumbent groups with quoting work still in motion."
          tone="default"
        />
        <StatCard
          label="Enrollments In Progress"
          value={kpis.enrollmentsInProgress.toString()}
          detail="Implementations or enrollment cycles with active follow-up work."
          tone="success"
        />
        <StatCard
          label="Pending Tasks"
          value={kpis.pendingTasks.toString()}
          detail="Broker queue items spanning renewals, documents, quotes, and service issues."
          tone="warning"
        />
        <StatCard
          label="MTD Commissions"
          value={formatCurrency(kpis.mtdCommissions)}
          detail="Month-to-date broker compensation across posted and pending statements."
          tone="info"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SurfaceCard
              title="Renewals needing action"
              description="Groups with imminent renewal dependencies, decisions, or missing inputs."
              action={
                <Link
                  href="/broker/renewals"
                  className="text-sm font-semibold text-[var(--tenant-primary-color)]"
                >
                  View renewals
                </Link>
              }
            >
              <div className="space-y-3">
                {renewalsNeedingAction.map((renewal) => (
                  <Link
                    key={renewal.id}
                    href={`/broker/renewals/${renewal.id}`}
                    className="block rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {renewal.groupName}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          {renewal.status} with {renewal.nextActions.length} next action
                          {renewal.nextActions.length === 1 ? '' : 's'}
                        </p>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Renewal date {formatShortDate(renewal.renewalDate)}
                        </p>
                      </div>
                      <BrokerWorkflowStatusBadge status={renewal.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Open quotes"
              description="Prospects and active groups still moving through marketing and proposal review."
              action={
                <Link
                  href="/broker/quotes"
                  className="text-sm font-semibold text-[var(--tenant-primary-color)]"
                >
                  Open quotes
                </Link>
              }
            >
              <div className="space-y-3">
                {openQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/broker/quotes/${quote.id}`}
                    className="block rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                  >
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{quote.prospectOrEmployerName}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {quote.proposalSummary}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Products: {quote.productsRequested.join(', ')}
                    </p>
                  </Link>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard
            title="Enrollment issues"
            description="Active implementation and enrollment blockers requiring broker follow-up."
            action={
              <Link
                href="/broker/enrollments"
                className="text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Review enrollments
              </Link>
            }
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {enrollmentIssues.map((group) => (
                <Link
                  key={group.id}
                  href={`/broker/book-of-business/${group.id}`}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{group.groupName}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {group.enrollmentSummary.status}
                      </p>
                    </div>
                    <StatusBadge label={group.status} />
                  </div>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--text-muted)]">
                    {group.enrollmentSummary.pendingItems.slice(0, 2).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            title="Recent activity"
            description="Latest carrier, client, and implementation updates across the broker portfolio."
          >
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <Link
                  key={`${item.groupId}-${item.date}-${item.description}`}
                  href={`/broker/book-of-business/${item.groupId}`}
                  className="block rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.groupName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatShortDate(item.date)}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {item.type} by {item.actor}
                  </p>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Commission snapshot" description="Month-to-date production and exception watch for your active portfolio.">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">MTD commissions</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
                  {formatCurrency(commissionSnapshot.mtdCommissions)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Posted groups</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {commissionSnapshot.postedGroups}
                  </p>
                </div>
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Exceptions</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                    {commissionSnapshot.exceptions}
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-slate-50 p-4">
                <p className="text-sm text-[var(--text-secondary)]">Pending statement value</p>
                <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                  {formatCurrency(commissionSnapshot.pendingValue)}
                </p>
              </div>
              <InlineButton href="/broker/commissions" tone="secondary">
                View commissions
              </InlineButton>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Broker alerts" description="Carrier, document, and operating alerts that need broker awareness.">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <SupportLink
                  key={alert.id}
                  href={alert.href}
                  label={alert.title}
                  description={alert.description}
                />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Pending tasks" description="Cross-functional broker tasks that still need attention this week.">
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="block rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{task.detail}</p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Due {formatShortDate(task.dueDate)}
                      </p>
                    </div>
                    <StatusBadge label={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
