import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { CreateTenantPanel } from '../../../tenants/create-tenant-panel';

export default function PlatformTenantCreatePage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Create tenant
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Provision a new tenant from a dedicated workflow, then return to the
            tenant health screen to monitor onboarding and open its detailed
            operator workspace.
          </p>
        </div>

        <CreateTenantPanel />
      </div>
    </PlatformAdminGate>
  );
}
