'use client';

import { MemberBenefitsWorkspaceContent } from './MemberBenefitsWorkspaceContent';
import { MemberWorkspaceDataBoundary } from './MemberWorkspaceDataBoundary';

export function MemberBenefitsDashboardPanel({
  sessionScopeKey
}: {
  sessionScopeKey: string;
}) {
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
      sessionScopeKey={sessionScopeKey}
      render={(data) => <MemberBenefitsWorkspaceContent embedded {...data} />}
    />
  );
}
