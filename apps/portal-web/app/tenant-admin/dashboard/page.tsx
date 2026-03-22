import { TenantAdminDashboardWorkspace } from '../../../components/tenant-admin/tenant-admin-workspaces';
import { getTenantAdminSessionContext } from '../../../lib/tenant-admin-session';
import { getTenantAdminWorkspaceData } from '../../../lib/tenant-admin-data';

export default async function TenantAdminDashboardPage() {
  const { tenantId, tenantName } = await getTenantAdminSessionContext();
  const workspace = getTenantAdminWorkspaceData(tenantId, tenantName);

  return <TenantAdminDashboardWorkspace summary={workspace.summary} />;
}
