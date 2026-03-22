import { TenantAdminRolesWorkspace } from '../../../components/tenant-admin/tenant-admin-workspaces';
import { getTenantAdminWorkspaceData } from '../../../lib/tenant-admin-data';
import { getTenantAdminSessionContext } from '../../../lib/tenant-admin-session';

export default async function TenantAdminRolesPage() {
  const { tenantId, tenantName } = await getTenantAdminSessionContext();
  const workspace = getTenantAdminWorkspaceData(tenantId, tenantName);

  return (
    <TenantAdminRolesWorkspace
      rolePermissions={workspace.rolePermissions}
      adminModules={workspace.adminModules}
    />
  );
}
