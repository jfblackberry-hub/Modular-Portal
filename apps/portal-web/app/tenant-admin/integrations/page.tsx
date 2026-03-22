import { TenantAdminIntegrationsWorkspace } from '../../../components/tenant-admin/tenant-admin-workspaces';
import { getTenantAdminWorkspaceData } from '../../../lib/tenant-admin-data';
import { getTenantAdminSessionContext } from '../../../lib/tenant-admin-session';

export default async function TenantAdminIntegrationsPage() {
  const { tenantId, tenantName } = await getTenantAdminSessionContext();
  const workspace = getTenantAdminWorkspaceData(tenantId, tenantName);

  return <TenantAdminIntegrationsWorkspace integrations={workspace.integrations} />;
}
