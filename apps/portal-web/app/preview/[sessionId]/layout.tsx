import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AdminPreviewBar } from '../../../components/admin-preview-bar';
import { PreviewRouteHydrator } from '../../../components/preview-route-hydrator';
import { PreviewSessionTracker } from '../../../components/preview-session-tracker';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function PreviewSessionLayout({
  children
}: {
  children: ReactNode;
}) {
  const sessionUser = await getPortalSessionUser();

  if (!sessionUser?.previewSession) {
    redirect('/preview/error?reason=missing-preview-session');
  }

  return (
    <>
      <PreviewRouteHydrator routePrefix={`/preview/${sessionUser.previewSession.id}`} />
      <PreviewSessionTracker />
      <AdminPreviewBar
        previewSession={sessionUser.previewSession}
        tenantName={sessionUser.tenant.name}
      />
      {children}
    </>
  );
}
