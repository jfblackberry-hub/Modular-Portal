import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { PlatformHealthPage } from './platform-health-page';

export default function AdminPlatformHealthPage() {
  return (
    <PlatformAdminGate>
      <PlatformHealthPage />
    </PlatformAdminGate>
  );
}
