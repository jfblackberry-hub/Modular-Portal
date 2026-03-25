import { AdminPageLayout } from '../../../../../components/admin-ui';
import { PermissionMatrix } from '../../../../../components/permission-matrix';
import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';

export default function AdminPlatformPermissionsPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Permission matrix"
        description="Review role-to-permission coverage as a dedicated governance view."
      >
        <PermissionMatrix />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
