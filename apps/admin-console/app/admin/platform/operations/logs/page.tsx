import { redirect } from 'next/navigation';

export default function LegacyPlatformLogsPage() {
  redirect('/admin/governance/audit');
}
