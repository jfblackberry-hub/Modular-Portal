import { getMemberCoverage } from '../../../lib/member-api';
import { formatDate } from '../../../lib/portal-format';
import {
  InlineButton,
  PageHeader,
  ProgressMeter,
  SurfaceCard
} from '../../../components/portal-ui';

export default async function BenefitsPage() {
  const coverage = await getMemberCoverage();
  const plan = coverage?.items[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Benefits"
        title="Benefits and coverage"
        description="Review plan highlights, effective dates, and cost-sharing information in a member-friendly layout."
        actions={<InlineButton href="/dashboard/id-card">Open ID card</InlineButton>}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <ProgressMeter
          label="Medical deductible"
          current={750}
          total={2000}
          helper="Applies to most in-network medical services."
        />
        <ProgressMeter
          label="Out-of-pocket maximum"
          current={1250}
          total={4500}
          helper="Tracks your covered medical and pharmacy spend."
        />
        <SurfaceCard
          title={plan?.planName ?? 'Coverage unavailable'}
          description="Current plan"
        >
          <dl className="space-y-3 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center justify-between gap-3">
              <dt>Effective date</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {plan ? formatDate(plan.effectiveDate) : 'Unavailable'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Coverage end date</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {plan?.terminationDate ? formatDate(plan.terminationDate) : 'Active'}
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
        <SurfaceCard
          title="Plan highlights"
          description="Common member questions answered up front."
        >
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
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {value}
                </p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="What to do next"
          description="Suggested actions based on your current coverage."
        >
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
