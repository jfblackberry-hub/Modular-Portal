import { redirect } from 'next/navigation';

export default function LegacyPlatformUsersPage() {
  redirect('/admin/shared/identity');
}
