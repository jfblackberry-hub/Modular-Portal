'use client';

import { getTimeOfDayGreeting } from '../../lib/get-time-of-day-greeting';
import { InlineButton, PageHeader, StatCard } from '../portal-ui';
import { BrokerDashboardWorkspaceSection } from './BrokerDashboardWorkspaceSection';

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
  sessionScopeKey: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export function BrokerCommandCenterDashboard({
  agencyName,
  brokerName,
  personaLabel,
  canManage,
  primaryActionLabel,
  kpis,
  sessionScopeKey
}: BrokerCommandCenterDashboardProps) {
  const greeting = getTimeOfDayGreeting(new Date());
  const heroDescription = `${agencyName} portfolio view for ${personaLabel.toLowerCase()} operations. Review summary KPIs first, then open the broker workspaces you need for renewals, quotes, commissions, and book-of-business detail.`;
  const statCards = [
    {
      label: 'Assigned Groups',
      value: kpis.assignedGroups.toString(),
      detail: 'Employer groups currently assigned in your active book of business.',
      tone: 'info' as const,
      href: '/broker/book-of-business',
      ctaLabel: 'Open book of business',
      previewItems: [
        'Open the book-of-business workspace to load assigned group detail.',
        'Portfolio segmentation and filters stay behind explicit workspace activation.',
        'Use the workspace when you need group-level enrollment context.'
      ]
    },
    {
      label: 'Renewals Due',
      value: kpis.renewalsDue.toString(),
      detail: 'Groups with renewal activity landing inside the next 120 days.',
      tone: 'warning' as const,
      href: '/broker/renewals',
      ctaLabel: 'Review renewal groups',
      previewItems: [
        'Renewal group detail loads only after you open the renewals workspace.',
        'Keep first paint focused on KPI summary instead of full renewal datasets.',
        'Use the renewals tab for expiring groups and due-date triage.'
      ]
    },
    {
      label: 'Open Quotes',
      value: kpis.openQuotes.toString(),
      detail: 'Prospects or incumbent groups with quoting work still in motion.',
      tone: 'default' as const,
      href: '/broker/quotes',
      ctaLabel: 'View quote activity',
      previewItems: [
        'Quote pipeline detail stays unloaded until the quotes workspace is selected.',
        'Initial render keeps the dashboard summary-only for deterministic boot.',
        'Open the quotes workspace for prospect and product-level context.'
      ]
    },
    {
      label: 'Enrollments In Progress',
      value: kpis.enrollmentsInProgress.toString(),
      detail: 'Implementations or enrollment cycles with active follow-up work.',
      tone: 'success' as const,
      href: '/broker/enrollments',
      ctaLabel: 'Open enrollment oversight',
      previewItems: [
        'Enrollment follow-up remains available through broker workspaces and route-level pages.',
        'The landing view keeps implementation detail out of the initial payload.',
        'Use workspaces for case-specific enrollment follow-up.'
      ]
    },
    {
      label: 'Pending Tasks',
      value: kpis.pendingTasks.toString(),
      detail: 'Broker queue items spanning renewals, documents, quotes, and service issues.',
      tone: 'warning' as const,
      href: '/broker/tasks',
      ctaLabel: 'Open work queue',
      previewItems: [
        'Task lists remain route-level detail instead of initial dashboard payload.',
        'Open the work queue only when operational follow-up is needed.',
        'This keeps the broker landing page summary-focused.'
      ]
    },
    {
      label: 'MTD Commissions',
      value: formatCurrency(kpis.mtdCommissions),
      detail: 'Month-to-date broker compensation across posted and pending statements.',
      tone: 'info' as const,
      href: '/broker/commissions',
      ctaLabel: 'Review commission details',
      previewItems: [
        'Commission records and exception detail load only after workspace activation.',
        'The dashboard keeps the first paint limited to summary KPI state.',
        'Open the commissions workspace for reconciliation detail.'
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

      <BrokerDashboardWorkspaceSection
        sessionScopeKey={sessionScopeKey}
        workspaceVariant={canManage ? 'brokerEmployer' : 'brokerIndividual'}
      />
    </div>
  );
}
