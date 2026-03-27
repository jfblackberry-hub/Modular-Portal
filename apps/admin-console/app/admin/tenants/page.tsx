import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { TenantListPage } from '../platform/tenants/tenant-pages';

export default function AdminTenantsDirectoryPage() {
  return (
    <PlatformAdminGate>
      <TenantListPage />
    </PlatformAdminGate>
  );
}
