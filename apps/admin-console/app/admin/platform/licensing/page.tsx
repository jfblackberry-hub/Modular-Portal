import { AdminPageLayout } from '../../../../components/admin-ui';
import { LicensingManagement } from '../../../../components/licensing-management';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';

export default function AdminPlatformLicensingPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Licensing"
        description="Manage tenant licensing and module entitlements as a dedicated control-plane function."
      >
        <LicensingManagement scope="platform" />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
