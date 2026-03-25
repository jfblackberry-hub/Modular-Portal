import { AdminPageLayout } from '../../../../components/admin-ui';
import { TenantRoleGovernance } from '../../../../components/tenant-role-governance';

export const dynamic = 'force-dynamic';

export default function AdminTenantRolesPage() {
  return (
    <AdminPageLayout
      eyebrow="Tenant"
      title="Roles and permissions"
      description="Manage tenant role assignments in a dedicated governance workspace."
    >
      <TenantRoleGovernance />
    </AdminPageLayout>
  );
}
