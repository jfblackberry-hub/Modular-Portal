import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { PlatformMetricsPanel } from '../../../platform/metrics/platform-metrics-panel';

export default function AdminPlatformMetricsPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Global metrics
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Inspect platform telemetry, service checks, and raw metrics for global operator visibility.
          </p>
        </div>

        <PlatformMetricsPanel />
      </div>
    </PlatformAdminGate>
  );
}
