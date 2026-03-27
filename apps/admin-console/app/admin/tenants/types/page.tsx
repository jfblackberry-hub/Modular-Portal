import { TenantTemplateManagementWorkspace } from '../../../../components/admin-control-plane-workspaces';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminTenantsTypesPage() {
  return (
    <PlatformAdminGate>
      <TenantTemplateManagementWorkspace />
    </PlatformAdminGate>
  );
}
