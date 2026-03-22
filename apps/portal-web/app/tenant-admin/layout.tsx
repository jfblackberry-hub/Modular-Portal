import { TenantAdminShell } from '../../components/tenant-admin/tenant-admin-shell';
import { getTenantAdminSessionContext } from '../../lib/tenant-admin-session';

export default async function TenantAdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await getTenantAdminSessionContext();

  return <TenantAdminShell user={user}>{children}</TenantAdminShell>;
}
