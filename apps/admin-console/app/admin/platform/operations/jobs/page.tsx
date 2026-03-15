import { JobsMonitoringPage } from '../../../../../components/jobs-monitoring-page';
import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';

export default async function AdminPlatformJobsPage({
  searchParams
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  const { tenantId } = await searchParams;

  return (
    <PlatformAdminGate>
      <JobsMonitoringPage scope="platform" initialTenantId={tenantId ?? 'ALL'} />
    </PlatformAdminGate>
  );
}
