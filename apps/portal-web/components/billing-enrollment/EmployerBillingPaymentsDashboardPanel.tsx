'use client';

import { EmployerBillingOverview } from './EmployerBillingOverview';
import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';

export function EmployerBillingPaymentsDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  return (
    <EmployerWorkspaceDataBoundary<{
      dataset: Parameters<typeof EmployerBillingOverview>[0]['dataset'];
    }>
      endpoint="/api/employer-dashboard/workspaces/billing-payments"
      label="Billing and payments"
      sessionScopeKey={sessionScopeKey}
      render={(data) => <EmployerBillingOverview embedded dataset={data.dataset} />}
    />
  );
}
