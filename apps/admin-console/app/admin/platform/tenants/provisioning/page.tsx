import { redirect } from 'next/navigation';

export default function LegacyPlatformProvisioningPage() {
  redirect('/admin/tenants/create');
}
