import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { AdminPageLayout } from '../../../../components/admin-ui';
import { FeatureFlagManagement } from '../../../feature-flags/feature-flag-management';

export default function AdminPlatformFeatureFlagsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Feature flags"
        description="Define and manage global or tenant-scoped feature capabilities from the platform workspace."
      >
        <FeatureFlagManagement />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
