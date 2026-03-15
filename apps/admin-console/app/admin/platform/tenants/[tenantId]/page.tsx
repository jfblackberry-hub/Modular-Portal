import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { TenantDetailPage } from '../tenant-pages';

export default async function AdminPlatformTenantDetailPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <PlatformAdminGate>
      <TenantDetailPage tenantId={tenantId} />
    </PlatformAdminGate>
  );
}
