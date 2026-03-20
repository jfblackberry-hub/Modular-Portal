'use client';

import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';
import { MemberBenefitsWorkspaceContent } from './MemberBenefitsWorkspaceContent';

export function MemberBenefitsDashboardPanel() {
  return (
    <MemberWorkspaceDataBoundary<{
      deductibleCurrent: number;
      deductibleTotal: number;
      effectiveDate?: string;
      outOfPocketCurrent: number;
      outOfPocketTotal: number;
      planName: string;
      terminationDate?: string | null;
    }>
      endpoint="/api/member-dashboard/workspaces/benefits"
      label="Benefits and coverage"
      render={(data) => <MemberBenefitsWorkspaceContent embedded {...data} />}
    />
  );
}
