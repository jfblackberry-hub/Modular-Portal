import { ConnectivityStatusPage } from '../../../../components/connectivity-status-page';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminOperationsConnectivityPage() {
  return (
    <PlatformAdminGate>
      <ConnectivityStatusPage scope="platform" />
    </PlatformAdminGate>
  );
}
