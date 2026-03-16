import { redirect } from 'next/navigation';

export default function ProviderLoginPage() {
  redirect('/login?user=Provider1');
}
