import { TenantLimitsUsageWorkspace } from '../../../../../components/admin-control-plane-workspaces';
import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';

export default async function AdminTenantLimitsPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantLimitsUsageWorkspace tenantId={tenantId} />
    </TenantAdminGate>
  );
}
