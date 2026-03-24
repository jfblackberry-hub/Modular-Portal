'use client';

import { MemberAuthorizationsWorkspaceContent } from './MemberAuthorizationsWorkspaceContent';
import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';

export function MemberAuthorizationsDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
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
      sessionScopeKey={sessionScopeKey}
      render={(data) => <MemberAuthorizationsWorkspaceContent embedded items={data.items} />}
    />
  );
}
