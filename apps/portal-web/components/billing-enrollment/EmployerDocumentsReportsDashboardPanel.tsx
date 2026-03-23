'use client';

import { EmployerDocumentsReportsWorkspaceContent } from './EmployerDocumentsReportsWorkspaceContent';
import { EmployerWorkspaceDataBoundary } from './EmployerWorkspaceDataBoundary';

export function EmployerDocumentsReportsDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  return (
    <EmployerWorkspaceDataBoundary<Parameters<typeof EmployerDocumentsReportsWorkspaceContent>[0]>
      endpoint="/api/employer-dashboard/workspaces/documents-reports"
      label="Documents and reports"
      sessionScopeKey={sessionScopeKey}
      render={(data) => <EmployerDocumentsReportsWorkspaceContent {...data} />}
    />
  );
}
