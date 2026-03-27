import { redirect } from 'next/navigation';

export default function LegacyPlatformRolesPage() {
  redirect('/admin/shared/identity');
}
