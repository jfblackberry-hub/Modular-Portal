import { redirect } from 'next/navigation';

export default function LegacyPlatformSessionsPage() {
  redirect('/admin/shared/identity');
}
