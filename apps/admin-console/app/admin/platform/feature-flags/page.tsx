import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { FeatureFlagManagement } from '../../../feature-flags/feature-flag-management';

export default function AdminPlatformFeatureFlagsPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Feature flags
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Define and manage global or tenant-scoped feature capabilities from the platform workspace.
          </p>
        </div>

        <FeatureFlagManagement />
      </div>
    </PlatformAdminGate>
  );
}
