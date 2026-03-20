import { redirect } from 'next/navigation';

export default function PlatformDashboardPage() {
  redirect('/admin/platform/health');
}
