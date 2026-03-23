import { MemberAuthorizationsWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberAuthorizationsWorkspaceContent';
import { getMemberAuthorizations } from '../../../lib/member-api';
import { getPortalSessionAccessToken } from '../../../lib/portal-session';

export default async function AuthorizationsPage() {
  const accessToken = await getPortalSessionAccessToken();
  const authorizations = await getMemberAuthorizations(accessToken ?? undefined);
  const items = authorizations?.items ?? [];

  return <MemberAuthorizationsWorkspaceContent items={items} />;
}
