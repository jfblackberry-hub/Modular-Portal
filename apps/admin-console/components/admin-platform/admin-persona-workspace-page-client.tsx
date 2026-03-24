'use client';

import { resolveStoredPersonaWorkspaceSession } from '../../lib/admin-platform-sessions';
import { AdminPersonaWorkspace } from './admin-persona-workspace';

export function AdminPersonaWorkspacePageClient({
  sessionId
}: {
  sessionId: string;
}) {
  const session = resolveStoredPersonaWorkspaceSession(sessionId);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#07101a] px-5 py-5 text-white">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-900/50 bg-[#0d1826] p-8 shadow-[0_20px_60px_rgba(5,10,18,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
            Session Unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
            This persona workspace is no longer available.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The requested admin persona session is missing, expired, or invalid. Open a
            new contained session from the admin platform to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminPersonaWorkspace
      sessionId={sessionId}
      tenantId={session?.tenantId ?? ''}
      personaType={session?.personaType ?? 'tenant_admin'}
      userId={session?.userId ?? ''}
    />
  );
}
