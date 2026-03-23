import { AdminPersonaWorkspacePageClient } from '../../../../components/admin-platform/admin-persona-workspace-page-client';

export default async function AdminPersonaWorkspacePage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return <AdminPersonaWorkspacePageClient sessionId={sessionId} />;
}
