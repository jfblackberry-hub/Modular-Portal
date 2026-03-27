import { AdminPageLayout } from '../../../../components/admin-ui';
import { LicensingManagement } from '../../../../components/licensing-management';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminGovernanceLicensingPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Governance"
        title="Licensing"
        description="Manage platform licensing posture and tenant entitlements in a dedicated governance workspace."
      >
        <LicensingManagement scope="platform" />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
