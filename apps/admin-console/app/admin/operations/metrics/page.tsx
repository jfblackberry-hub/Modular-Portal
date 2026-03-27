import { AdminPageLayout } from '../../../../components/admin-ui';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { PlatformMetricsPanel } from '../../../../components/platform-metrics-panel';

export default function AdminOperationsMetricsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Operations"
        title="Metrics"
        description="Operational metrics and telemetry for the platform control plane."
      >
        <PlatformMetricsPanel />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
