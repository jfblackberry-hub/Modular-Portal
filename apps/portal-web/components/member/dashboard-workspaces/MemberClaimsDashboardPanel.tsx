'use client';

import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';
import { MemberClaimsWorkspaceContent } from './MemberClaimsWorkspaceContent';

export function MemberClaimsDashboardPanel() {
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
      render={(data) => <MemberClaimsWorkspaceContent embedded items={data.items} />}
    />
  );
}
