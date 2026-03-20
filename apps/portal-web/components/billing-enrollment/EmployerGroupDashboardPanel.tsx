'use client';

import { EmployeeCensusList } from './EmployeeCensusList';
import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';

export function EmployerGroupDashboardPanel() {
  return (
    <EmployerWorkspaceDataBoundary<{
      coverageTypes: string[];
      departments: string[];
      employees: Parameters<typeof EmployeeCensusList>[0]['employees'];
      employerName: string;
      plans: string[];
      summary: Parameters<typeof EmployeeCensusList>[0]['summary'];
    }>
      endpoint="/api/employer-dashboard/workspaces/group-dashboard"
      label="Group dashboard"
      render={(data) => <EmployeeCensusList embedded {...data} />}
    />
  );
}
