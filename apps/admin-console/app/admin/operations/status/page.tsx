import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { PlatformHealthPage } from '../../platform/health/platform-health-page';

export default function AdminOperationsStatusPage() {
  return (
    <PlatformAdminGate>
      <PlatformHealthPage />
    </PlatformAdminGate>
  );
}
