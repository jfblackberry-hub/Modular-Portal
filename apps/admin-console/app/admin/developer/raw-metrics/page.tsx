import { AdminPageLayout } from '../../../../components/admin-ui';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { PlatformMetricsPanel } from '../../../../components/platform-metrics-panel';

export default function AdminDeveloperRawMetricsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Developer Mode"
        title="Raw Metrics"
        description="Low-level platform diagnostics and raw telemetry for developer troubleshooting."
      >
        <PlatformMetricsPanel />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
