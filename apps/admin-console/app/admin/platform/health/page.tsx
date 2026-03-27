import { redirect } from 'next/navigation';

export default function LegacyPlatformHealthPage() {
  redirect('/admin/overview/health');
}
