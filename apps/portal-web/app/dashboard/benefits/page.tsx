import { MemberBenefitsWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberBenefitsWorkspaceContent';
import { getMemberCoverage } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function BenefitsPage() {
  const sessionUser = await getPortalSessionUser();
  const coverage = await getMemberCoverage(sessionUser?.id);
  const plan = coverage?.items[0];

  return (
    <MemberBenefitsWorkspaceContent
      deductibleCurrent={750}
      deductibleTotal={2000}
      effectiveDate={plan?.effectiveDate}
      outOfPocketCurrent={1250}
      outOfPocketTotal={4500}
      planName={plan?.planName ?? 'Coverage unavailable'}
      terminationDate={plan?.terminationDate}
    />
  );
}
