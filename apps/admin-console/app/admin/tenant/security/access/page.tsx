import { redirect } from 'next/navigation';

export default function LegacyTenantAccessPage() {
  redirect('/admin');
}
