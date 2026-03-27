import { redirect } from 'next/navigation';

export default function LegacyTenantHealthPage() {
  redirect('/admin');
}
