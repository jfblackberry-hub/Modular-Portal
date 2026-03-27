import { redirect } from 'next/navigation';

export default function LegacyPlatformTenantTypesPage() {
  redirect('/admin/tenants/types');
}
