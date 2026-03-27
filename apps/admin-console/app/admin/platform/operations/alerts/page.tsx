import { redirect } from 'next/navigation';

export default function LegacyPlatformAlertsPage() {
  redirect('/admin/overview/alerts');
}
