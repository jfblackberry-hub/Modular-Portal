'use client';

import { getTimeOfDayGreeting } from '../../lib/get-time-of-day-greeting';
import type { BrokerAlert, BrokerGroup, BrokerTask } from '../../lib/broker-portfolio-data';
import type { BrokerQuote, BrokerRenewal } from '../../lib/broker-sales-workspace-data';
import { InlineButton, PageHeader, StatCard, SupportLink, SurfaceCard } from '../portal-ui';

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
  commissionSnapshot,
  alerts,
  tasks
}: BrokerCommandCenterDashboardProps) {
  const greeting = getTimeOfDayGreeting(new Date());
  const heroDescription = `${agencyName} portfolio view for ${personaLabel.toLowerCase()} operations. Track renewal exposure, open quotes, enrollment blockers, and commission activity across your assigned groups.`;
  const statCards = [
    {
      label: 'Assigned Groups',
      value: kpis.assignedGroups.toString(),
      detail: 'Employer groups currently assigned in your active book of business.',
      tone: 'info' as const,
      href: '/broker/book-of-business',
      ctaLabel: 'Open book of business',
      previewItems: enrollmentIssues.slice(0, 3).map((group) => {
        const pendingCount = group.enrollmentSummary.pendingItems.length;
        return `${group.groupName}: ${group.status} with ${pendingCount} enrollment item${pendingCount === 1 ? '' : 's'} to review.`;
      })
    },
    {
      label: 'Renewals Due',
      value: kpis.renewalsDue.toString(),
      detail: 'Groups with renewal activity landing inside the next 120 days.',
      tone: 'warning' as const,
      href: '/broker/renewals',
      ctaLabel: 'Review renewal groups',
      previewItems: renewalsNeedingAction.slice(0, 3).map((renewal) =>
        `${renewal.groupName}: ${renewal.status} due ${formatShortDate(renewal.renewalDate)}.`
      )
    },
    {
      label: 'Open Quotes',
      value: kpis.openQuotes.toString(),
      detail: 'Prospects or incumbent groups with quoting work still in motion.',
      tone: 'default' as const,
      href: '/broker/quotes',
      ctaLabel: 'View quote activity',
      previewItems: openQuotes.slice(0, 3).map((quote) =>
        `${quote.prospectOrEmployerName}: ${quote.productsRequested.join(', ')}.`
      )
    },
    {
      label: 'Enrollments In Progress',
      value: kpis.enrollmentsInProgress.toString(),
      detail: 'Implementations or enrollment cycles with active follow-up work.',
      tone: 'success' as const,
      href: '/broker/enrollments',
      ctaLabel: 'Open enrollment oversight',
      previewItems: enrollmentIssues.slice(0, 3).map((group) => {
        const nextItem = group.enrollmentSummary.pendingItems[0] ?? 'Review group setup';
        return `${group.groupName}: ${nextItem}.`;
      })
    },
    {
      label: 'Pending Tasks',
      value: kpis.pendingTasks.toString(),
      detail: 'Broker queue items spanning renewals, documents, quotes, and service issues.',
      tone: 'warning' as const,
      href: '/broker/tasks',
      ctaLabel: 'Open work queue',
      previewItems: tasks.slice(0, 3).map((task) => `${task.title}: due ${formatShortDate(task.dueDate)}.`)
    },
    {
      label: 'MTD Commissions',
      value: formatCurrency(kpis.mtdCommissions),
      detail: 'Month-to-date broker compensation across posted and pending statements.',
      tone: 'info' as const,
      href: '/broker/commissions',
      ctaLabel: 'Review commission details',
      previewItems: [
        `${commissionSnapshot.postedGroups} posted group statement${commissionSnapshot.postedGroups === 1 ? '' : 's'}.`,
        `${commissionSnapshot.exceptions} exception${commissionSnapshot.exceptions === 1 ? '' : 's'} need reconciliation.`,
        `${formatCurrency(commissionSnapshot.pendingValue)} is still pending.`
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Broker KPI summary">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <SurfaceCard title="Broker alerts" description="Carrier, document, and operating alerts that need broker awareness.">
        <div className="grid gap-3 xl:grid-cols-2">
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
    </div>
  );
}
