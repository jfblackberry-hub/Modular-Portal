import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { PreviewSessionWorkspace } from '../../../../../components/preview-session-workspace';

export default function AdminPlatformSessionsPage() {
  return (
    <PlatformAdminGate>
      <PreviewSessionWorkspace />
    </PlatformAdminGate>
  );
}
