import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { PlatformMetricsPanel } from './platform-metrics-panel';

export default function PlatformMetricsPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Metrics and health
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Monitor live platform readiness and inspect metrics emitted by the
            multi-tenant platform.
          </p>
        </div>

        <PlatformMetricsPanel />
      </div>
    </PlatformAdminGate>
  );
}
