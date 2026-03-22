import { TenantAdminUsersWorkspace } from '../../../components/tenant-admin/tenant-admin-workspaces';
import { getTenantAdminWorkspaceData } from '../../../lib/tenant-admin-data';
import { getTenantAdminSessionContext } from '../../../lib/tenant-admin-session';

export default async function TenantAdminUsersPage() {
  const { tenantId, tenantName } = await getTenantAdminSessionContext();
  const workspace = getTenantAdminWorkspaceData(tenantId, tenantName);

  return <TenantAdminUsersWorkspace administrators={workspace.administrators} />;
}
