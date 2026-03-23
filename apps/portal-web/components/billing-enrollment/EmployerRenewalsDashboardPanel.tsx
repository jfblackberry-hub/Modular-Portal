'use client';

import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';
import { OpenEnrollmentOverview } from './OpenEnrollmentOverview';

export function EmployerRenewalsDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  return (
    <EmployerWorkspaceDataBoundary<Parameters<typeof OpenEnrollmentOverview>[0]>
      endpoint="/api/employer-dashboard/workspaces/renewals"
      label="Renewals"
      sessionScopeKey={sessionScopeKey}
      render={(data) => <OpenEnrollmentOverview embedded {...data} />}
    />
  );
}
