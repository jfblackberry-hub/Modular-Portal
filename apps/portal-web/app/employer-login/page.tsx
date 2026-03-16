import { redirect } from 'next/navigation';

export default function EmployerLoginPage() {
  redirect('/login?user=blue-horizon-health');
}
