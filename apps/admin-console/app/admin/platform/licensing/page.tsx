import { redirect } from 'next/navigation';

export default function LegacyPlatformLicensingPage() {
  redirect('/admin/governance/licensing');
}
