import { TenantAdminConfigurationWorkspace } from '../../../components/tenant-admin/tenant-admin-workspaces';
import { getTenantAdminWorkspaceData } from '../../../lib/tenant-admin-data';
import { getTenantAdminSessionContext } from '../../../lib/tenant-admin-session';

export default async function TenantAdminConfigurationPage() {
  const { tenantId, tenantName } = await getTenantAdminSessionContext();
  const workspace = getTenantAdminWorkspaceData(tenantId, tenantName);

  return (
    <TenantAdminConfigurationWorkspace
      profile={workspace.profile}
      notifications={workspace.notifications}
      billingPreferences={workspace.billingPreferences}
    />
  );
}
