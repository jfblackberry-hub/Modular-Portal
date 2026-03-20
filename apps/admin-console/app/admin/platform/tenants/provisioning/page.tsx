import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { AdminPageLayout } from '../../../../../components/admin-ui';
import { CreateTenantPanel } from '../../../../tenants/create-tenant-panel';

export default function AdminPlatformTenantProvisioningPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Tenant provisioning wizard"
        description="Guide new tenants through modules, limits, connectivity, accounts, and default behaviors before handoff."
      >
        <CreateTenantPanel />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
