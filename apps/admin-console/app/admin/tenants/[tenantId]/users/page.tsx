import { TenantAdminGate } from '../../../../../components/tenant-admin-gate';
import { UserListPage } from '../../../../../components/user-list-page';

export default async function AdminTenantUsersPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <TenantAdminGate>
      <UserListPage scope="tenant" tenantId={tenantId} />
    </TenantAdminGate>
  );
}
