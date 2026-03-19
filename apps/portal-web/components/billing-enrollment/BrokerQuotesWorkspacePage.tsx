'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { BrokerQuote, BrokerQuoteStatus } from '../../lib/broker-sales-workspace-data';
import { EmptyState, InlineButton, PageHeader, StatCard, SurfaceCard } from '../portal-ui';
import { BrokerWorkflowStatusBadge } from './BrokerWorkflowStatusBadge';

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function BrokerQuotesWorkspacePage({ quotes }: { quotes: BrokerQuote[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BrokerQuoteStatus | ''>('');

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (
        normalizedSearch &&
        ![
          quote.prospectOrEmployerName,
          quote.marketSegment,
          quote.assignedBrokerRep,
          quote.productsRequested.join(' ')
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (status && quote.status !== status) {
        return false;
      }

      return true;
    });
  }, [quotes, search, status]);

  const summary = useMemo(
    () => ({
      active: quotes.filter((quote) => !['Sold', 'Closed Lost'].includes(quote.status)).length,
      censusNeeded: quotes.filter((quote) => quote.status === 'Census Needed').length,
      proposalReady: quotes.filter((quote) => quote.status === 'Proposal Ready').length,
      sold: quotes.filter((quote) => quote.status === 'Sold').length
    }),
    [quotes]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Quotes"
        description="Manage broker quote intake, census readiness, proposal status, and next steps across prospects and incumbent opportunities."
        actions={
          <>
            <InlineButton href="/broker/quotes/new">Start New Quote</InlineButton>
            <InlineButton href="/broker/documents" tone="secondary">
              Upload Census
            </InlineButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active quotes"
          value={summary.active.toString()}
          detail="Quotes that are still moving through intake, review, or presentation."
          tone="info"
        />
        <StatCard
          label="Census needed"
          value={summary.censusNeeded.toString()}
          detail="Quote records waiting on final census or current plan details."
          tone="warning"
        />
        <StatCard
          label="Proposal ready"
          value={summary.proposalReady.toString()}
          detail="Quotes with proposal materials staged for broker or client review."
          tone="success"
        />
        <StatCard
          label="Sold"
          value={summary.sold.toString()}
          detail="Opportunities won and ready for implementation handoff."
          tone="success"
        />
      </section>

      <SurfaceCard title="Quote workspace" description="Search and triage broker quoting activity by account, market segment, and workflow status.">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Search quotes</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search prospect or employer"
              className="portal-input w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BrokerQuoteStatus | '')}
              className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
            >
              <option value="">All statuses</option>
              {['Draft', 'Census Needed', 'In Review', 'Proposal Ready', 'Presented', 'Sold', 'Closed Lost'].map(
                (option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <InlineButton href="/broker/quotes/new">Start New Quote</InlineButton>
          <InlineButton href="/broker/documents" tone="secondary">
            Upload Census
          </InlineButton>
        </div>

        <div className="mt-6">
          {filteredQuotes.length === 0 ? (
            <EmptyState
              title="No quotes match the current view"
              description="Try clearing the status filter or broadening the search to see more broker quote activity."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="portal-data-table min-w-[1040px] w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Prospect / employer</th>
                    <th>Market segment</th>
                    <th>Effective date target</th>
                    <th>Products requested</th>
                    <th>Census status</th>
                    <th>Last updated</th>
                    <th>Assigned broker rep</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>
                        <Link
                          href={`/broker/quotes/${quote.id}`}
                          className="font-semibold text-[var(--tenant-primary-color)]"
                        >
                          {quote.prospectOrEmployerName}
                        </Link>
                      </td>
                      <td>{quote.marketSegment}</td>
                      <td>{formatDateLabel(quote.effectiveDateTarget)}</td>
                      <td>{quote.productsRequested.join(', ')}</td>
                      <td>{quote.censusStatus}</td>
                      <td>{formatDateLabel(quote.lastUpdated)}</td>
                      <td>{quote.assignedBrokerRep}</td>
                      <td>
                        <BrokerWorkflowStatusBadge status={quote.status} />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <InlineButton href={`/broker/quotes/${quote.id}`} tone="secondary">
                            {quote.status === 'Draft' ? 'Continue Draft' : 'View Detail'}
                          </InlineButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}
