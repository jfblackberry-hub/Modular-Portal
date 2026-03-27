import { redirect } from 'next/navigation';

export default function LegacyPlatformAuditOverviewPage() {
  redirect('/admin/overview/activity');
}
