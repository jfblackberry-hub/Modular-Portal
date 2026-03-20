import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { AdminPageLayout } from '../../../../../components/admin-ui';
import { CreateTenantPanel } from '../../../../tenants/create-tenant-panel';

export default function AdminPlatformTenantConfigurationPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Tenant configuration"
        description="Launch the guided tenant configuration workflow to fully provision modules, limits, connectivity, and operating defaults."
      >
        <CreateTenantPanel />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
