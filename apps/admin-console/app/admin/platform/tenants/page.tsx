import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { TenantListPage } from './tenant-pages';

export default function AdminPlatformTenantsPage() {
  return (
    <PlatformAdminGate>
      <TenantListPage />
    </PlatformAdminGate>
  );
}
