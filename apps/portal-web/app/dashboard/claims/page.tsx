import { MemberClaimsWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberClaimsWorkspaceContent';
import { getMemberClaims } from '../../../lib/member-api';
import { getPortalSessionAccessToken } from '../../../lib/portal-session';

export default async function ClaimsPage() {
  const accessToken = await getPortalSessionAccessToken();
  const claims = await getMemberClaims(accessToken ?? undefined);
  const items = claims?.items ?? [];

  return <MemberClaimsWorkspaceContent items={items} />;
}
