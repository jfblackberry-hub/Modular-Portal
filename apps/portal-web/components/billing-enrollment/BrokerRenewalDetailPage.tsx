'use client';

import type { BrokerGroup } from '../../lib/broker-portfolio-data';
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export function BrokerRenewalDetailPage({
  renewal,
  group
}: {
  renewal: BrokerRenewal;
  group: BrokerGroup | null;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title={renewal.groupName}
        description={`${renewal.marketSegment} renewal scheduled for ${formatDateLabel(renewal.renewalDate)}. Review current and proposed plans, contribution impact, open checklist items, and next broker actions.`}
        actions={
          <>
            <InlineButton href="/broker/renewals" tone="secondary">
              Back to renewals
            </InlineButton>
            <InlineButton href="/broker/documents">Open documents</InlineButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.8fr)]">
        <div className="space-y-4">
          <SurfaceCard title="Renewal summary" description="High-level status, timing, and broker workflow posture for this renewal.">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Renewal status</p>
                <div className="mt-3">
                  <BrokerWorkflowStatusBadge status={renewal.status} />
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  {renewal.daysUntilRenewal} days until renewal
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Rate change</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                  {renewal.rateChangeSummary.rateChangePercent.toFixed(1)}%
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {formatCurrency(renewal.rateChangeSummary.currentMonthlyPremium)} to{' '}
                  {formatCurrency(renewal.rateChangeSummary.proposedMonthlyPremium)}
                </p>
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard title="Current plan summary" description="Current renewal baseline and carrier position.">
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>{renewal.currentPlanSummary.carrier}</p>
                <p>{renewal.currentPlanSummary.planName}</p>
                <p>{renewal.currentPlanSummary.fundingType}</p>
                <p>{formatCurrency(renewal.currentPlanSummary.monthlyPremium)} monthly premium</p>
              </div>
            </SurfaceCard>
            <SurfaceCard title="Proposed plan summary" description="Current recommended or quoted renewal position.">
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>{renewal.proposedPlanSummary.carrier}</p>
                <p>{renewal.proposedPlanSummary.planName}</p>
                <p>{renewal.proposedPlanSummary.fundingType}</p>
                <p>{formatCurrency(renewal.proposedPlanSummary.monthlyPremium)} monthly premium</p>
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard title="Contribution impact summary" description="Illustrative contribution impact by common coverage tier.">
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(renewal.contributionImpactSummary).map(([tier, value]) => (
                <div key={tier} className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{tier}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Renewal checklist" description="Checklist progress for the current broker renewal workflow.">
            <div className="space-y-3">
              {renewal.checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border-subtle)] bg-white p-4 text-sm"
                >
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className={item.completed ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    {item.completed ? 'Complete' : 'Open'}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Documents needed" description="Open document dependencies still blocking completion.">
            <div className="space-y-3">
              {renewal.documentsNeeded.length > 0 ? (
                renewal.documentsNeeded.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                  >
                    {item}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm text-[var(--text-secondary)]">
                  No open document requests.
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Next steps" description="Immediate broker actions to keep the renewal on track.">
            <div className="space-y-3">
              {renewal.nextActions.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </SurfaceCard>

          {group ? (
            <SurfaceCard title="Group context" description="Current employer group context pulled from the broker book of business.">
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p>{group.segment} • {group.region}</p>
                <p>Assigned rep: {group.assignedRep}</p>
                <p>Account manager: {group.accountManager}</p>
                <p>Current products: {group.currentProducts.join(', ')}</p>
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
