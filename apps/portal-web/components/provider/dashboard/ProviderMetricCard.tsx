export interface ProviderMetric {
  label: string;
  value: string;
  trend?: string;
}

export function ProviderMetricCard({ metric }: { metric: ProviderMetric }) {
  return (
    <article className="portal-card p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{metric.label}</p>
      <p className="mt-1 text-3xl font-semibold leading-none text-[var(--text-primary)]">{metric.value}</p>
      {metric.trend ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{metric.trend}</p> : null}
    </article>
  );
}
