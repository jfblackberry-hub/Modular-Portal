import { redirect } from 'next/navigation';

import { MemberCommandCenter } from '../../components/dashboard/member-command-center';
import {
  getMe,
  getMemberClaims,
  getMemberCoverage,
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

  if (
    sessionUser?.landingContext === 'broker' ||
    sessionUser?.roles.includes('broker') ||
    sessionUser?.roles.includes('broker_admin') ||
    sessionUser?.roles.includes('broker_staff') ||
    sessionUser?.roles.includes('broker_readonly') ||
    sessionUser?.roles.includes('broker_read_only') ||
    sessionUser?.roles.includes('account_executive')
  ) {
    redirect('/broker');
  }

  const sessionUserId = sessionUser?.id;
  const [me, coverage, claims] = await Promise.all([
    getMe(sessionUserId),
    getMemberCoverage(sessionUserId),
    getMemberClaims(sessionUserId)
  ]);

  const member = me?.member;
  const activeCoverage = coverage?.items[0];
  const planName =
    activeCoverage?.planName ??
    `${sessionUser?.tenant.name ?? 'Member'} Gold PPO`;

  return (
    <MemberCommandCenter
      memberName={
        member
          ? `${member.firstName} ${member.lastName}`
          : `${sessionUser?.firstName ?? ''} ${sessionUser?.lastName ?? ''}`.trim() || 'Member'
      }
      memberId={member?.memberNumber ?? 'Unavailable'}
      employerGroupName={sessionUser?.tenant.name ?? 'Employer'}
      planName={planName}
      pcpName="Dr. Maya Thompson"
      recentClaims={claims?.items ?? []}
      deductibleCurrent={750}
      deductibleTotal={2000}
      outOfPocketCurrent={1250}
      outOfPocketTotal={4500}
      coverageStatus={activeCoverage ? 'Active' : 'Status unavailable'}
    />
  );
}
