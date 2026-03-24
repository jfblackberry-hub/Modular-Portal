import { AdminPageLayout } from '../../../../components/admin-ui';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { PlatformMetricsPanel } from '../../../../components/platform-metrics-panel';

export default function AdminPlatformMetricsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Global metrics"
        description="Inspect platform telemetry, service checks, and raw metrics for global operator visibility."
      >
        <PlatformMetricsPanel />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
