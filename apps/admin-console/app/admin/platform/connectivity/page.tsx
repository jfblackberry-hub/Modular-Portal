import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { ConnectivityStatusPage } from '../../../../components/connectivity-status-page';

export default function AdminPlatformConnectivityPage() {
  return (
    <PlatformAdminGate>
      <ConnectivityStatusPage scope="platform" />
    </PlatformAdminGate>
  );
}
