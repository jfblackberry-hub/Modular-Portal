import type { ProviderOperationsDashboardContract } from '@payer-portal/api-contracts';
import type { PortalSessionUser } from '../../lib/portal-session';
import { ProviderOperationsDashboard } from './operations/provider-operations-widget-registry';

export function ProviderDashboardPage({
  clinicName,
  dashboard,
  providerName,
  user
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
  providerName: string;
  user: PortalSessionUser;
}) {
  return (
    <ProviderOperationsDashboard
      clinicName={clinicName}
      dashboard={dashboard}
      providerName={providerName}
      user={user}
    />
  );
}
