import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';
import { TenantDetailPage } from '../../../platform/tenants/tenant-pages';

export default async function AdminTenantOrganizationPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <TenantDetailPage tenantId={tenantId} />
    </TenantAdminGate>
  );
}
