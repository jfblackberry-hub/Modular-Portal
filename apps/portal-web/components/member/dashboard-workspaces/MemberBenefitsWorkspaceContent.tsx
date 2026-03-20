'use client';

import { formatDate } from '../../../lib/portal-format';
import { InlineButton, PageHeader, ProgressMeter, SurfaceCard } from '../../portal-ui';

export function MemberBenefitsWorkspaceContent({
  deductibleCurrent,
  deductibleTotal,
  effectiveDate,
  embedded = false,
  outOfPocketCurrent,
  outOfPocketTotal,
  planName,
  terminationDate
}: {
  deductibleCurrent: number;
  deductibleTotal: number;
  effectiveDate?: string;
  embedded?: boolean;
  outOfPocketCurrent: number;
  outOfPocketTotal: number;
  planName: string;
  terminationDate?: string | null;
}) {
  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          eyebrow="Benefits"
          title="Benefits and coverage"
          description="Review plan highlights, effective dates, and cost-sharing information in a member-friendly layout."
          actions={<InlineButton href="/dashboard/id-card">Open ID card</InlineButton>}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <ProgressMeter
          label="Medical deductible"
          current={deductibleCurrent}
          total={deductibleTotal}
          helper="Applies to most in-network medical services."
        />
        <ProgressMeter
          label="Out-of-pocket maximum"
          current={outOfPocketCurrent}
          total={outOfPocketTotal}
          helper="Tracks your covered medical and pharmacy spend."
        />
        <SurfaceCard title={planName} description="Current plan">
          <dl className="space-y-3 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center justify-between gap-3">
              <dt>Effective date</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {effectiveDate ? formatDate(effectiveDate) : 'Unavailable'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Coverage end date</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {terminationDate ? formatDate(terminationDate) : 'Active'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Network</dt>
              <dd className="font-semibold text-[var(--text-primary)]">PPO</dd>
            </div>
          </dl>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard title="Plan highlights" description="Common member questions answered up front.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Primary care visit', '$25 copay'],
              ['Specialist visit', '$50 copay'],
              ['Urgent care', '$75 copay'],
              ['Emergency room', '$350 copay'],
              ['Generic prescriptions', '$15 copay'],
              ['Preferred brand drugs', '$45 copay']
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl bg-[var(--bg-page)] p-5">
                <p className="text-sm text-[var(--text-secondary)]">{label}</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="What to do next" description="Suggested actions based on your current coverage.">
          <div className="space-y-4 text-sm leading-6 text-[var(--text-secondary)]">
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              Review your digital ID card before your next appointment.
            </div>
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              Confirm provider network status before scheduling specialty care.
            </div>
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              Check recent EOBs and compare them with any provider bills you receive.
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
