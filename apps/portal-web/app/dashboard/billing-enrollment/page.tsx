import { redirect } from 'next/navigation';

import { resolveBillingPortalAudience } from '../../../lib/billing-portal-audience';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function BillingEnrollmentOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: 'live' | 'mock' | 'empty' | 'error' }>;
}) {
  await searchParams;
  const sessionUser = await getPortalSessionUser();

  if (!sessionUser) {
    redirect('/login');
  }

  const audience = resolveBillingPortalAudience(sessionUser);
  redirect(
    audience === 'employer' ? '/employer' : audience === 'broker' ? '/broker' : '/individual'
  );
}
