import { redirect } from 'next/navigation';

export default function LegacyPlatformPermissionsPage() {
  redirect('/admin/shared/identity');
}
