'use client';

import type { MemberFindCareProvider } from './MemberFindCareWorkspaceContent';
import { MemberFindCareWorkspaceContent } from './MemberFindCareWorkspaceContent';
import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';

export function MemberFindCareDashboardPanel() {
  return (
    <MemberWorkspaceDataBoundary<{
      providers: MemberFindCareProvider[];
    }>
      endpoint="/api/member-dashboard/workspaces/find-care"
      label="Find care"
      render={(data) => <MemberFindCareWorkspaceContent embedded providers={data.providers} />}
    />
  );
}
