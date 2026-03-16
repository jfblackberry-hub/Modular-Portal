import { redirect } from 'next/navigation';

import { MemberCommandCenter } from '../../components/dashboard/member-command-center';
import {
  getMe,
  getMemberAuthorizations,
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
  const [me, coverage, claims, documents, messages, authorizations] = await Promise.all([
    getMe(sessionUserId),
    getMemberCoverage(sessionUserId),
    getMemberClaims(sessionUserId),
    getMemberDocuments(sessionUserId),
    getMemberMessages(sessionUserId),
    getMemberAuthorizations(sessionUserId)
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
      claims={claims?.items ?? []}
      messages={messages?.items ?? []}
      documents={documents?.items ?? []}
      pendingAuthorizations={authorizations?.items ?? []}
      pcpName="Dr. Maya Thompson"
      deductibleCurrent={750}
      deductibleTotal={2000}
      outOfPocketCurrent={1250}
      outOfPocketTotal={4500}
      coverageStatus={activeCoverage ? 'Active' : 'Status unavailable'}
      searchBasePath="/dashboard/search"
    />
  );
}
