import { redirect } from 'next/navigation';

export default function TenantAdminRootPage() {
  redirect('/tenant-admin/dashboard');
}
