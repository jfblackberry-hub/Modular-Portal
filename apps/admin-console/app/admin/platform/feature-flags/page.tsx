import { redirect } from 'next/navigation';

export default function LegacyPlatformFeatureFlagsPage() {
  redirect('/admin/shared/feature-flags');
}
