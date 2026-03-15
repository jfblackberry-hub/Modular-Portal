import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { CreateTenantPanel } from '../../../../tenants/create-tenant-panel';

export default function AdminPlatformTenantProvisioningPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Tenant provisioning
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Provision new tenants in a dedicated workflow without leaving the persistent admin workspace.
          </p>
        </div>

        <CreateTenantPanel />
      </div>
    </PlatformAdminGate>
  );
}
