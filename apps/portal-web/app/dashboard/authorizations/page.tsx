import { MemberAuthorizationsWorkspaceContent } from '../../../components/member/dashboard-workspaces/MemberAuthorizationsWorkspaceContent';
import { getMemberAuthorizations } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function AuthorizationsPage() {
  const sessionUser = await getPortalSessionUser();
  const authorizations = await getMemberAuthorizations(sessionUser?.id);
  const items = authorizations?.items ?? [];

  return <MemberAuthorizationsWorkspaceContent items={items} />;
}
