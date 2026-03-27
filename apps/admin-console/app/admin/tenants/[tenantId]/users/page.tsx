import { TenantUsersPersonasWorkspace } from '../../../../../components/admin-control-plane-workspaces';
import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';

export default async function AdminTenantUsersPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantUsersPersonasWorkspace tenantId={tenantId} />
    </TenantAdminGate>
  );
}
