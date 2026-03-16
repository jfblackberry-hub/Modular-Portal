import { redirect } from 'next/navigation';

import { HeroBanner } from '../../components/dashboard/hero-banner';
import { MyPlanSection } from '../../components/dashboard/my-plan-section';
import { RecentActivitySection } from '../../components/dashboard/recent-activity-section';
import { SupportSection } from '../../components/dashboard/support-section';
import {
  getMe,
  getMemberClaims,
  getMemberCoverage,
  getMemberDocuments,
  getMemberMessages
} from '../../lib/member-api';
import { getPortalSessionUser } from '../../lib/portal-session';

export default async function DashboardPage() {
  const sessionUser = await getPortalSessionUser();

  if (
    sessionUser?.landingContext === 'employer' ||
    sessionUser?.roles.includes('employer_group_admin')
  ) {
    redirect('/dashboard/billing-enrollment');
  }

  const sessionUserId = sessionUser?.id;
  const [me, coverage, claims, documents, messages] = await Promise.all([
    getMe(sessionUserId),
    getMemberCoverage(sessionUserId),
    getMemberClaims(sessionUserId),
    getMemberDocuments(sessionUserId),
    getMemberMessages(sessionUserId)
  ]);

  const member = me?.member;
  const activeCoverage = coverage?.items[0];
  const recentClaim = claims?.items[0];
  const recentClaimStatus = recentClaim
    ? `${recentClaim.claimNumber} - ${recentClaim.status}`
    : 'No recent claims';
  const hasIdCard = Boolean(member?.memberNumber);
  const nextAction = hasIdCard ? 'Review latest claim details' : 'View your ID card';

  return (
    <div className="space-y-8">
      <HeroBanner
        memberName={member?.firstName ?? sessionUser?.firstName ?? 'Member'}
        planName={activeCoverage?.planName ?? 'Blue Horizon Gold PPO'}
        coverageStatus={activeCoverage ? 'Active' : 'Status unavailable'}
        memberNumber={member?.memberNumber ?? 'Unavailable'}
        pcpName="Dr. Maya Thompson"
        deductibleCurrent={750}
        deductibleTotal={2000}
        recentClaimStatus={recentClaimStatus}
        nextAction={nextAction}
      />

      <MyPlanSection
        planName={activeCoverage?.planName ?? 'Blue Horizon Gold PPO'}
        coverageStatus={activeCoverage ? 'Active' : 'Status unavailable'}
        memberName={
          member ? `${member.firstName} ${member.lastName}` : `${sessionUser?.firstName ?? ''} ${sessionUser?.lastName ?? ''}`.trim() || 'Member'
        }
        memberId={member?.memberNumber ?? 'Unavailable'}
        groupNumber="GRP-20418"
        deductibleCurrent={750}
        deductibleTotal={2000}
        outOfPocketCurrent={1250}
        outOfPocketTotal={4500}
      />

      <RecentActivitySection
        claims={claims?.items.slice(0, 3) ?? []}
        messages={messages?.items.slice(0, 3) ?? []}
        documents={documents?.items.slice(0, 3) ?? []}
      />

      <SupportSection />
    </div>
  );
}
