import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { TenantManagement } from '../../tenants/tenant-management';

export default function PlatformTenantsPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Tenant operations
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            View all tenants, create new tenants, suspend tenant access, review
            tenant health, and manage quotas from one centralized operator screen.
          </p>
        </div>

        <TenantManagement />
      </div>
    </PlatformAdminGate>
  );
}
