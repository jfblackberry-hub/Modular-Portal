import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';
import { TenantAdminSettings } from '../../../../../components/tenant-admin-settings';

export default async function AdminTenantConfigurationPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantAdminSettings tenantId={tenantId} />
    </TenantAdminGate>
  );
}
