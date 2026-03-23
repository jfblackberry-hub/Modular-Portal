import { MemberBenefitsWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberBenefitsWorkspaceContent';
import { getMemberCoverage } from '../../../lib/member-api';
import { getPortalSessionAccessToken } from '../../../lib/portal-session';

export default async function BenefitsPage() {
  const accessToken = await getPortalSessionAccessToken();
  const coverage = await getMemberCoverage(accessToken ?? undefined);
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
