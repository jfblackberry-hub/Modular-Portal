import { redirect } from 'next/navigation';

export default function LegacyTenantProfilePage() {
  redirect('/admin');
}
