import { AdminPageLayout } from '../../../../components/admin-ui';
import { PlatformAdminGate } from '../../../../components/platform-admin-gate';
import { RoleManagement } from '../../../roles/role-management';

export default function AdminPlatformRolesPage() {
  return (
    <PlatformAdminGate>
      <AdminPageLayout
        eyebrow="Platform"
        title="Role management"
        description="Maintain platform RBAC definitions and assign roles across the shared tenant landscape."
      >
        <RoleManagement />
      </AdminPageLayout>
    </PlatformAdminGate>
  );
}
