import { TenantDataIntegrationsWorkspace } from '../../../../../components/admin-control-plane-workspaces';
import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';

export default async function AdminTenantDataPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantDataIntegrationsWorkspace tenantId={tenantId} />
    </TenantAdminGate>
  );
}
