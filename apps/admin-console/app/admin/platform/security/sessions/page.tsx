import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { PreviewSessionControl } from '../../../../../components/preview-session-control';

export default function AdminPlatformSessionsPage() {
  return (
    <PlatformAdminGate>
      <PreviewSessionControl />
    </PlatformAdminGate>
  );
}
