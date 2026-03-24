'use client';

import { MemberIdCardWorkspaceContent } from './MemberIdCardWorkspaceContent';
import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';

export function MemberIdCardDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
  return (
    <MemberWorkspaceDataBoundary<{
      effectiveDate?: string;
      groupNumber: string;
      issuerName: string;
      logoUrl?: string;
      memberId: string;
      memberName: string;
      planName: string;
      rxBin: string;
      rxGrp: string;
      rxPcn: string;
      supportEmail: string;
      supportPhone: string;
      terminationDate?: string | null;
      updatedAt?: string;
    }>
      endpoint="/api/member-dashboard/workspaces/id-card"
      label="Digital ID card"
      sessionScopeKey={sessionScopeKey}
      render={(data) => <MemberIdCardWorkspaceContent embedded {...data} />}
    />
  );
}
