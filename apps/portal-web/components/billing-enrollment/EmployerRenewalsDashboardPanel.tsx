'use client';

import { OpenEnrollmentOverview } from './OpenEnrollmentOverview';
import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';

export function EmployerRenewalsDashboardPanel() {
  return (
    <EmployerWorkspaceDataBoundary<Parameters<typeof OpenEnrollmentOverview>[0]>
      endpoint="/api/employer-dashboard/workspaces/renewals"
      label="Renewals"
      render={(data) => <OpenEnrollmentOverview embedded {...data} />}
    />
  );
}
