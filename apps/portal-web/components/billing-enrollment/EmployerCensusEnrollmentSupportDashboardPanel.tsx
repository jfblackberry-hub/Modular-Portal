'use client';

import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';
import { EnrollmentActivityPendingList } from './EnrollmentActivityPendingList';

export function EmployerCensusEnrollmentSupportDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  return (
    <EmployerWorkspaceDataBoundary<Parameters<typeof EnrollmentActivityPendingList>[0]>
      endpoint="/api/employer-dashboard/workspaces/census-support"
      label="Census and enrollment support"
      sessionScopeKey={sessionScopeKey}
      render={(data) => <EnrollmentActivityPendingList embedded {...data} />}
    />
  );
}
