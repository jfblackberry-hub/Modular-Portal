import { redirect } from 'next/navigation';

export default function LegacyPlatformIdentityPage() {
  redirect('/admin/shared/identity');
}
