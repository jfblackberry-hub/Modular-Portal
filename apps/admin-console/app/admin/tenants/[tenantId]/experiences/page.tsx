import { TenantExperienceBuilderWorkspace } from '../../../../../components/admin-control-plane-workspaces';
import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';

export default async function AdminTenantExperiencesPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantExperienceBuilderWorkspace tenantId={tenantId} />
    </TenantAdminGate>
  );
}
