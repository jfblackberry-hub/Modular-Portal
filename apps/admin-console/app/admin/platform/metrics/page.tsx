import { redirect } from 'next/navigation';

export default function LegacyPlatformMetricsPage() {
  redirect('/admin/operations/metrics');
}
