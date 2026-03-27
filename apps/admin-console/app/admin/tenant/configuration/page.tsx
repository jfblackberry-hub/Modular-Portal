import { redirect } from 'next/navigation';

export default function LegacyTenantConfigurationPage() {
  redirect('/admin');
}
