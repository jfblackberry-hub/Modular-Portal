import { BillingEnrollmentDashboard } from '../../../components/billing-enrollment/BillingEnrollmentDashboard';

export default async function BillingEnrollmentOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: 'live' | 'mock' | 'empty' | 'error' }>;
}) {
  const { mode } = await searchParams;
  return <BillingEnrollmentDashboard mode={mode ?? 'live'} />;
}
