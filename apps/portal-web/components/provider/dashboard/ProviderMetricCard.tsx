export interface ProviderMetric {
  label: string;
  value: string;
  trend?: string;
  trendTone?: 'positive' | 'negative' | 'neutral';
}

const trendToneClassName: Record<NonNullable<ProviderMetric['trendTone']>, string> = {
  positive: 'text-emerald-700',
  negative: 'text-amber-700',
  neutral: 'text-sky-700'
};

export function ProviderMetricCard({ metric }: { metric: ProviderMetric }) {
  const trendTone = metric.trendTone ?? 'neutral';

  return (
    <article className="portal-card p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{metric.label}</p>
      <p className="mt-2 text-3xl font-semibold leading-none text-[var(--text-primary)]">{metric.value}</p>
      {metric.trend ? (
        <p className={`mt-2 text-xs font-semibold ${trendToneClassName[trendTone]}`}>
          {metric.trend}
        </p>
      ) : null}
    </article>
  );
}
