'use client';

import { useState } from 'react';

import type { BrokerGroup } from '../../lib/broker-portfolio-data';
import type { BrokerQuote } from '../../lib/broker-sales-workspace-data';
import { InlineButton, PageHeader, SurfaceCard } from '../portal-ui';
import { BrokerWorkflowStatusBadge } from './BrokerWorkflowStatusBadge';

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function BrokerQuoteDetailPage({
  quote,
  group
}: {
  quote: BrokerQuote;
  group: BrokerGroup | null;
}) {
  const [markedSold, setMarkedSold] = useState(false);
  const resolvedStatus = markedSold ? 'Sold' : quote.status;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title={quote.prospectOrEmployerName}
        description={`${quote.marketSegment} quote targeted for ${formatDateLabel(quote.effectiveDateTarget)}. Review products, census readiness, proposal status, and next broker actions.`}
        actions={
          <>
            <InlineButton href="/broker/quotes" tone="secondary">
              Back to quotes
            </InlineButton>
            <InlineButton href="/broker/quotes/new">Start New Quote</InlineButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <SurfaceCard title="Quote summary" description="Broker quote intake and proposal context.">
            <div className="grid gap-4 md:grid-cols-2 text-sm text-[var(--text-secondary)]">
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</p>
                <div className="mt-3">
                  <BrokerWorkflowStatusBadge status={resolvedStatus} />
                </div>
                <p className="mt-4">Assigned rep: {quote.assignedBrokerRep}</p>
                <p className="mt-2">Last updated: {formatDateLabel(quote.lastUpdated)}</p>
              </div>
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Requested coverage</p>
                <p className="mt-3">{quote.productsRequested.join(', ')}</p>
                <p className="mt-2">Coverage tiers: {quote.coverageTiers.join(', ')}</p>
                <p className="mt-2">Census status: {quote.censusStatus}</p>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Proposal summary</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{quote.proposalSummary}</p>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Broker next actions" description="Operational next steps to move this quote toward presentation or close.">
            <div className="space-y-3">
              {quote.nextActions.map((action) => (
                <div
                  key={action}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {action}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Notes" description="Broker-facing context for this quote opportunity.">
            <div className="space-y-3">
              {quote.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Quick actions" description="Common broker quote actions for this account.">
            <div className="flex flex-wrap gap-3">
              <InlineButton href="/broker/quotes/new" tone="secondary">
                Continue Draft
              </InlineButton>
              <InlineButton href="/broker/documents" tone="secondary">
                Upload Census
              </InlineButton>
              <InlineButton href="/broker/documents" tone="secondary">
                View Proposal
              </InlineButton>
              <button
                type="button"
                onClick={() => setMarkedSold(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
              >
                Mark Sold
              </button>
            </div>
          </SurfaceCard>

          {group ? (
            <SurfaceCard title="Linked employer context" description="This quote is tied to an existing employer group in the broker portfolio.">
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>{group.groupName}</p>
                <p>{group.segment} • {group.region}</p>
                <p>Current products: {group.currentProducts.join(', ')}</p>
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
