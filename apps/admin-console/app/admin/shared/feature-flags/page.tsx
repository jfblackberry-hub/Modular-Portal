import { FeatureFlagManagement } from '../../../../app/feature-flags/feature-flag-management';
import { CapabilityRegistryWorkspace } from '../../../../components/admin-control-plane-workspaces';
import { AdminPageLayout } from '../../../../components/admin-ui';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminSharedFeatureFlagsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Shared Services"
        title="Feature Flags"
        description="Manage global feature flags and the metadata-driven Capability Registry from one shared-service workspace."
      >
        <div className="space-y-6">
        <CapabilityRegistryWorkspace embedded />
        <FeatureFlagManagement />
        </div>
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
