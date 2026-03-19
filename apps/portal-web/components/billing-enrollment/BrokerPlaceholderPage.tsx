import { EmptyState, InlineButton, PageHeader, SurfaceCard } from '../portal-ui';
import { getBrokerPageMeta, type BrokerPageId } from '../../lib/broker-portal-config';

const sectionHighlights: Record<BrokerPageId, string[]> = {
  dashboard: [
    'Broker KPI cards and portfolio work queues.',
    'Recent activity, commission exceptions, and client alerts.',
    'Client snapshot aligned to renewal and enrollment timing.'
  ],
  'book-of-business': [
    'Assigned group roster with segment, effective dates, and renewal posture.',
    'Missing census and document tracking for active accounts.',
    'At-a-glance filtering for prospects, active clients, and terminated groups.'
  ],
  quotes: [
    'Open quote requests and underwriting dependency tracking.',
    'Carrier and proposal milestones across prospects and incumbent business.',
    'Placeholder actions for quote creation, follow-up, and case escalation.'
  ],
  renewals: [
    'Groups in renewal with due dates, decision milestones, and blockers.',
    'Missing documents, contribution decisions, and census readiness.',
    'Broker-friendly language for portfolio triage instead of employer self-service.'
  ],
  enrollments: [
    'Implementation and enrollment statuses across multiple employer groups.',
    'Census discrepancies, eligibility blockers, and effective date monitoring.',
    'Space reserved for future broker-to-employer handoff workflows.'
  ],
  commissions: [
    'Statement readiness, reconciliation exceptions, and broker of record changes.',
    'Commission-specific wording and placeholders for future payment views.',
    'Clear separation from employer billing language.'
  ],
  documents: [
    'Broker document requests, census uploads, and signed paperwork tracking.',
    'Cross-group visibility into missing files and recent uploads.',
    'Placeholder structure for carrier and client document workflows.'
  ],
  tasks: [
    'Broker operational queue for cases, escalations, and follow-up work.',
    'Support for multi-group issue routing and prioritization.',
    'Useful scaffolding until case services are connected.'
  ],
  support: [
    'Broker support contacts, renewal calendars, and training resources.',
    'Enablement guidance for quoting, enrollment, and commission workflows.',
    'Intentional placeholder language so the page feels complete, not broken.'
  ]
};

export function BrokerPlaceholderPage({ pageId }: { pageId: BrokerPageId }) {
  const meta = getBrokerPageMeta(pageId);
  const highlights = sectionHighlights[pageId];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        actions={<InlineButton href={meta.ctaHref}>{meta.ctaLabel}</InlineButton>}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <SurfaceCard
          title="Broker workflow overview"
          description="This workspace outlines the broker tasks, queue patterns, and operational context planned for this module."
        >
          <div className="space-y-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
              >
                {highlight}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <EmptyState
            title={meta.emptyStateTitle}
            description={meta.emptyStateDescription}
          />
          <SurfaceCard
            title="Module direction"
            description="This area is prepared for future broker workflow expansion while keeping the current portal shell and shared platform patterns consistent."
          >
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              The current release provides a navigable broker-first module with practical workflow framing, and it can be extended later with deeper backend integrations.
            </p>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
