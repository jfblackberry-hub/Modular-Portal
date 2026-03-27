import { CreateTenantWorkspace } from '../../../../components/admin-control-plane-workspaces';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminTenantsCreatePage() {
  return (
    <PlatformAdminGate>
      <CreateTenantWorkspace />
    </PlatformAdminGate>
  );
}
