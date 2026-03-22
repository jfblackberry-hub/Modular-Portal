import { TenantAdminAuditWorkspace } from '../../../components/tenant-admin/tenant-admin-workspaces';
import { getTenantAdminAuditEvents } from '../../../lib/tenant-admin-audit';
import { getTenantAdminSessionContext } from '../../../lib/tenant-admin-session';

export default async function TenantAdminAuditPage() {
  await getTenantAdminSessionContext();
  const auditEvents = await getTenantAdminAuditEvents();

  return <TenantAdminAuditWorkspace auditEvents={auditEvents} />;
}
