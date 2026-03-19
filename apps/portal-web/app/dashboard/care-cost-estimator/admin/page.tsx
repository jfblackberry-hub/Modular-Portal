import { SurfaceCard } from '../../../../components/portal-ui';
import { getEstimatorAdminConfig } from '../../../../lib/care-cost-estimator/service';

export default function CareCostEstimatorAdminPage() {
  const config = getEstimatorAdminConfig();

  return (
    <div className="space-y-6">
      <SurfaceCard
        title="Care Cost Estimator Mock Configuration"
        description="Seeded plans, procedures, providers, contract rates, and audit structures backing the member estimator experience."
      >
        <div className="grid gap-4 xl:grid-cols-4">
          <article className="rounded-2xl bg-[var(--bg-page)] p-5"><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Plans</p><p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{config.plans.length}</p></article>
          <article className="rounded-2xl bg-[var(--bg-page)] p-5"><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Benefit rules</p><p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{config.planRules.length}</p></article>
          <article className="rounded-2xl bg-[var(--bg-page)] p-5"><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Providers / facilities</p><p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{config.providers.length}</p></article>
          <article className="rounded-2xl bg-[var(--bg-page)] p-5"><p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Audit events</p><p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{config.auditLogCount}</p></article>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard title="Mock Plans" description="Three seeded plan designs with distinct deductible, OOP maximum, and cost share behavior.">
          <div className="space-y-3">
            {config.plans.map((plan) => (
              <article key={plan.id} className="rounded-2xl bg-[var(--bg-page)] p-5">
                <p className="font-semibold text-[var(--text-primary)]">{plan.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{plan.description}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Deductible ${plan.deductible.toLocaleString()} · OOP max ${plan.oopMax.toLocaleString()}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Seeded Procedures" description="Core service catalog entries available in the estimator search and estimation engine.">
          <div className="space-y-3">
            {config.procedures.map((procedure) => (
              <article key={procedure.id} className="rounded-2xl bg-[var(--bg-page)] p-5">
                <p className="font-semibold text-[var(--text-primary)]">{procedure.name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{procedure.code} · {procedure.plainEnglish}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
