import { redirect } from 'next/navigation';

export default function LegacyTenantUsersPage() {
  redirect('/admin');
}
