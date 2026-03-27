import { redirect } from 'next/navigation';

export default function LegacyPlatformSettingsPage() {
  redirect('/admin/shared/feature-flags');
}
