import { PlatformAdminGate } from '../../../components/platform-admin-gate';
import { FeatureFlagManagement } from '../../feature-flags/feature-flag-management';

export default function PlatformAdminFeatureFlagsPage() {
  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Feature flag management
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-admin-muted">
            Enable or disable platform capabilities globally or per tenant to
            control plugins and feature rollout.
          </p>
        </div>

        <FeatureFlagManagement />
      </div>
    </PlatformAdminGate>
  );
}
