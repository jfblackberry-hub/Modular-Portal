import { TenantCapabilitiesWorkspace } from '../../../../../components/admin-control-plane-workspaces';
import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';

export default async function AdminTenantCapabilitiesPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantCapabilitiesWorkspace tenantId={tenantId} />
    </TenantAdminGate>
  );
}
