import { redirect } from 'next/navigation';

export default function LegacyPlatformTenantsPage() {
  redirect('/admin/tenants');
}
