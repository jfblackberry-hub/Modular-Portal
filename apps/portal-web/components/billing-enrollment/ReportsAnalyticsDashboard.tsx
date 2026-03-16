import type { AnalyticsDataset, AnalyticsSeriesPoint } from '../../lib/reports-analytics-data';
import { EmptyState } from '../portal-ui';

function maxValue(points: AnalyticsSeriesPoint[]) {
  return points.reduce((max, point) => (point.value > max ? point.value : max), 0);
}

function LineBars({ title, points }: { title: string; points: AnalyticsSeriesPoint[] }) {
  const max = Math.max(1, maxValue(points));

  return (
    <article className="portal-card p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="mt-4 grid gap-2">
        {points.map((point) => (
          <div key={point.label}>
            <div className="mb-1 flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>{point.label}</span>
              <span className="font-semibold text-[var(--text-primary)]">{point.value.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-[var(--tenant-primary-color)]" style={{ width: `${Math.max(4, (point.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PieLike({ title, points }: { title: string; points: AnalyticsSeriesPoint[] }) {
  const total = points.reduce((sum, point) => sum + point.value, 0);

  return (
    <article className="portal-card p-5">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="mt-4 space-y-2">
        {points.map((point, index) => {
          const ratio = total > 0 ? (point.value / total) * 100 : 0;
          const colorClass = index % 3 === 0 ? 'bg-sky-500' : index % 3 === 1 ? 'bg-emerald-500' : 'bg-amber-500';

          return (
            <div key={point.label} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
                  <span className="text-[var(--text-secondary)]">{point.label}</span>
                </div>
                <span className="font-semibold text-[var(--text-primary)]">{ratio.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function ReportsAnalyticsDashboard({ dataset }: { dataset: AnalyticsDataset }) {
  const hasData = dataset.summaryMetrics.length > 0;

  if (!hasData) {
    return <EmptyState title="No analytics data" description="No analytics are available for current filter selections." />;
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Reports &amp; Analytics</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Analytics Dashboard</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">Coverage, enrollment, dependent, and billing trends using tenant-scoped analytics data.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dataset.summaryMetrics.map((metric) => (
          <article key={metric.label} className="portal-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{metric.value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{metric.change}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PieLike title="Coverage Distribution" points={dataset.coverageDistribution} />
        <PieLike title="Plan Enrollment Breakdown" points={dataset.planEnrollmentBreakdown} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PieLike title="Dependent Coverage Ratios" points={dataset.dependentCoverageRatios} />
        <LineBars title="Enrollment Trends" points={dataset.enrollmentTrends} />
      </section>

      <section>
        <LineBars title="Billing Trends" points={dataset.billingTrends} />
      </section>
    </div>
  );
}
