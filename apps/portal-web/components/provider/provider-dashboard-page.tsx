import type { ProviderOperationsDashboardContract } from '@payer-portal/api-contracts';

import { ProviderOperationsDashboard } from './operations/provider-operations-widget-registry';

export function ProviderDashboardPage({
  clinicName,
  dashboard,
  providerName
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
  providerName: string;
}) {
  return (
    <ProviderOperationsDashboard
      clinicName={clinicName}
      dashboard={dashboard}
      providerName={providerName}
    />
  );
}
