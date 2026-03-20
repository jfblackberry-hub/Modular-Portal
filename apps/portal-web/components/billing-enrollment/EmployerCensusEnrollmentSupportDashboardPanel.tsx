'use client';

import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';
import { EnrollmentActivityPendingList } from './EnrollmentActivityPendingList';

export function EmployerCensusEnrollmentSupportDashboardPanel() {
  return (
    <EmployerWorkspaceDataBoundary<Parameters<typeof EnrollmentActivityPendingList>[0]>
      endpoint="/api/employer-dashboard/workspaces/census-support"
      label="Census and enrollment support"
      render={(data) => <EnrollmentActivityPendingList embedded {...data} />}
    />
  );
}
