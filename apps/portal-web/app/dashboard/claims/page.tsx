import { MemberClaimsWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberClaimsWorkspaceContent';
import { getMemberClaims } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function ClaimsPage() {
  const sessionUser = await getPortalSessionUser();
  const claims = await getMemberClaims(sessionUser?.id);
  const items = claims?.items ?? [];

  return <MemberClaimsWorkspaceContent items={items} />;
}
