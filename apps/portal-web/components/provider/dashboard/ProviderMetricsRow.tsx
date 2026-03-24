import { type ProviderMetric,ProviderMetricCard } from './ProviderMetricCard';

export function ProviderMetricsRow({ metrics }: { metrics: ProviderMetric[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <ProviderMetricCard key={metric.label} metric={metric} />
      ))}
    </section>
  );
}
