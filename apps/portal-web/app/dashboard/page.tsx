import {
  getMe,
  getMemberClaims,
  getMemberCoverage,
  getMemberDocuments,
  getMemberMessages
} from '../../lib/member-api';
import { getPortalSessionUser } from '../../lib/portal-session';
import { getTenantBranding } from '../../lib/tenant-branding';
import { HeroBanner } from '../../components/dashboard/hero-banner';
import { MyPlanSection } from '../../components/dashboard/my-plan-section';
import { RecentActivitySection } from '../../components/dashboard/recent-activity-section';
import { SupportSection } from '../../components/dashboard/support-section';

export default async function DashboardPage() {
  const sessionUser = await getPortalSessionUser();
  const [me, coverage, claims, documents, messages] = await Promise.all([
    getMe(),
    getMemberCoverage(),
    getMemberClaims(),
    getMemberDocuments(),
    getMemberMessages()
  ]);

  const member = me?.member;
  const activeCoverage = coverage?.items[0];
  const tenantBranding = sessionUser
    ? await getTenantBranding(sessionUser.tenant, sessionUser.id)
    : undefined;
  return (
    <div className="space-y-8">
      <HeroBanner
        memberName={member?.firstName ?? sessionUser?.firstName ?? 'Member'}
        planName={activeCoverage?.planName ?? 'Blue Horizon Gold PPO'}
        coverageStatus={activeCoverage ? 'Active' : 'Status unavailable'}
        heroImageUrl={tenantBranding?.heroImageUrl}
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
