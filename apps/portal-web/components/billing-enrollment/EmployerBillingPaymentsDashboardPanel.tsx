'use client';

import { EmployerBillingOverview } from './EmployerBillingOverview';
import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';

export function EmployerBillingPaymentsDashboardPanel() {
  return (
    <EmployerWorkspaceDataBoundary<{
      dataset: Parameters<typeof EmployerBillingOverview>[0]['dataset'];
    }>
      endpoint="/api/employer-dashboard/workspaces/billing-payments"
      label="Billing and payments"
      render={(data) => <EmployerBillingOverview embedded dataset={data.dataset} />}
    />
  );
}
