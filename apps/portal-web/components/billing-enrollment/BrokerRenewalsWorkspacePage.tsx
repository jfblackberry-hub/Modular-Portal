'use client';

import Link from 'next/link';

import type { BrokerRenewal } from '../../lib/broker-sales-workspace-data';
import { InlineButton, PageHeader, SurfaceCard } from '../portal-ui';
import { BrokerWorkflowStatusBadge } from './BrokerWorkflowStatusBadge';

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function BrokerRenewalsWorkspacePage({
  groupedRenewals
}: {
  groupedRenewals: Record<string, BrokerRenewal[]>;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Renewals"
        description="Prioritize employer renewals by timing window, broker status, and the next actions needed to move each group toward a clean decision."
        actions={
          <>
            <InlineButton href="/broker/book-of-business" tone="secondary">
              Open book of business
            </InlineButton>
            <InlineButton href="/broker/documents">Open documents</InlineButton>
          </>
        }
      />

      <div className="space-y-4">
        {Object.entries(groupedRenewals).map(([windowLabel, renewals]) => (
          <SurfaceCard
            key={windowLabel}
            title={`${windowLabel} renewal window`}
            description={`${renewals.length} renewal${renewals.length === 1 ? '' : 's'} currently fall into this timing bucket.`}
          >
            <div className="grid gap-3">
              {renewals.map((renewal) => (
                <Link
                  key={renewal.id}
                  href={`/broker/renewals/${renewal.id}`}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{renewal.groupName}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {renewal.marketSegment} • Renewal date {formatDateLabel(renewal.renewalDate)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Next steps: {renewal.nextActions[0]}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {renewal.daysUntilRenewal} days
                      </p>
                      <BrokerWorkflowStatusBadge status={renewal.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
