'use client';

import { MemberClaimsWorkspaceContent } from './MemberClaimsWorkspaceContent';
import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';

export function MemberClaimsDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  return (
    <MemberWorkspaceDataBoundary<{
      items: Array<{
        claimDate: string;
        claimNumber: string;
        id: string;
        sourceSystem: string;
        status: string;
        totalAmount: number;
      }>;
    }>
      endpoint="/api/member-dashboard/workspaces/claims"
      label="Claims"
      sessionScopeKey={sessionScopeKey}
      render={(data) => <MemberClaimsWorkspaceContent embedded items={data.items} />}
    />
  );
}
