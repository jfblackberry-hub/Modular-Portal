'use client';

import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';
import { MemberAuthorizationsWorkspaceContent } from './MemberAuthorizationsWorkspaceContent';

export function MemberAuthorizationsDashboardPanel() {
  return (
    <MemberWorkspaceDataBoundary<{
      items: Array<{
        detail?: string | null;
        id: string;
        service: string;
        status: string;
        submittedOn: string;
      }>;
    }>
      endpoint="/api/member-dashboard/workspaces/authorizations"
      label="Authorizations and referrals"
      render={(data) => <MemberAuthorizationsWorkspaceContent embedded items={data.items} />}
    />
  );
}
