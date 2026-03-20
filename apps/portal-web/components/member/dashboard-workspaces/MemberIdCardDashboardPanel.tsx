'use client';

import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';
import { MemberIdCardWorkspaceContent } from './MemberIdCardWorkspaceContent';

export function MemberIdCardDashboardPanel() {
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
      render={(data) => <MemberIdCardWorkspaceContent embedded {...data} />}
    />
  );
}
