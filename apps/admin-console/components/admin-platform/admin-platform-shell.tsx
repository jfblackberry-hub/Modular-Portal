'use client';

import { useCallback, useState } from 'react';

import { recordPersonaSessionAuditEvent } from '../../lib/admin-platform-audit';
import { getPersonaLabel } from '../../lib/admin-platform-sessions';
import { useAdminSession } from '../admin-session-provider';
import { PlatformAdminGate } from '../platform-admin-gate';
import { AdminPlatformSessionManagerProvider, useAdminPlatformSessionManager } from './admin-platform-session-manager';
import { PersonaSelectorFlow } from './persona-selector-flow';
import { PersonaWindowContainer } from './persona-window-container';

function AdminPlatformShellContent() {
  const { session, signOut, error: sessionError } = useAdminSession();
  const {
    activeSessionId,
    addSession,
    removeSession,
    setActiveSession,
    sessions
  } = useAdminPlatformSessionManager();
  const [auditError, setAuditError] = useState('');

  const handleCreateSession = useCallback(
    (draft: Parameters<typeof addSession>[0]) => {
      setAuditError('');
      const nextSession = addSession(draft);

      void recordPersonaSessionAuditEvent({
        action: 'persona.session.opened',
        sessionId: nextSession.id,
        tenantId: nextSession.tenantId,
        personaType: nextSession.personaType,
        userId: nextSession.userId
      }).catch((error) => {
        removeSession(nextSession.id);
        setAuditError(
          error instanceof Error
            ? error.message
            : 'Unable to record persona session activity.'
        );
      });
    },
    [addSession, removeSession]
  );

  const handleCloseSession = useCallback(
    (sessionId: string) => {
      setAuditError('');
      const removedSession = sessions.find((sessionItem) => sessionItem.id === sessionId);

      if (!removedSession) {
        return;
      }

      void recordPersonaSessionAuditEvent({
        action: 'persona.session.closed',
        sessionId: removedSession.id,
        tenantId: removedSession.tenantId,
        personaType: removedSession.personaType,
        userId: removedSession.userId
      })
        .then(() => {
          removeSession(sessionId);
        })
        .catch((error) => {
          setAuditError(
            error instanceof Error
              ? error.message
              : 'Unable to record persona session activity.'
          );
        });
    },
    [removeSession, sessions]
  );

  const handleFocusSession = useCallback(
    (sessionId: string) => {
      setAuditError('');
      if (sessionId === activeSessionId) {
        return;
      }

      const focusedSession = sessions.find((sessionItem) => sessionItem.id === sessionId);

      if (!focusedSession) {
        return;
      }

      void recordPersonaSessionAuditEvent({
        action: 'persona.session.focused',
        sessionId: focusedSession.id,
        tenantId: focusedSession.tenantId,
        personaType: focusedSession.personaType,
        userId: focusedSession.userId
      })
        .then(() => {
          setActiveSession(sessionId);
        })
        .catch((error) => {
          setAuditError(
            error instanceof Error
              ? error.message
              : 'Unable to record persona session activity.'
          );
        });
    },
    [activeSessionId, sessions, setActiveSession]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10223b_0%,#08111d_44%,#050a12_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col gap-6 px-5 py-5 lg:px-7">
        <header className="rounded-[32px] border border-[#213450] bg-[#08111d]/80 px-6 py-5 shadow-[0_30px_80px_rgba(4,10,20,0.45)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Admin Platform Shell
              </p>
              <h1 className="mt-3 text-[2.5rem] font-semibold tracking-[-0.05em] text-white">
                Isolated multi-session control plane
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Launch concurrent persona workspaces under <code>/admin</code> with
                explicit tenant and user boundaries. Each session runs in its own
                contained window to prevent accidental context bleed.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[#2a4060] bg-[#0e1b2f] px-4 py-2 text-sm text-slate-300">
                Admin auth: {session?.email ?? 'Unavailable'}
              </div>
              <div className="rounded-full border border-[#2a4060] bg-[#0e1b2f] px-4 py-2 text-sm text-slate-300">
                Concurrent sessions: {sessions.length}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOut();
                  } catch {
                    return;
                  }
                }}
                className="rounded-full border border-[#2a4060] px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {auditError || sessionError ? (
          <div className="rounded-3xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {auditError || sessionError}
          </div>
        ) : null}

        <div className="grid flex-1 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="space-y-4">
            <PersonaSelectorFlow onCreateSession={handleCreateSession} />

            <section className="rounded-[28px] border border-[#223451] bg-[#0b1628] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Active sessions
              </p>
              <div className="mt-4 space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No persona sessions created yet.
                  </p>
                ) : (
                  sessions.map((sessionItem) => (
                    <button
                      key={sessionItem.id}
                      type="button"
                      onClick={() => handleFocusSession(sessionItem.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        sessionItem.id === activeSessionId
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-[#223451] bg-[#101e34] hover:border-[#36577d]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">
                        {getPersonaLabel(sessionItem.personaType)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Tenant {sessionItem.tenantId} · User {sessionItem.userId}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>

          <main>
            <PersonaWindowContainer
              activeSessionId={activeSessionId}
              onCloseSession={handleCloseSession}
              onFocusSession={handleFocusSession}
              sessions={sessions}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminPlatformShell() {
  return (
    <PlatformAdminGate>
      <AdminPlatformSessionManagerProvider>
        <AdminPlatformShellContent />
      </AdminPlatformSessionManagerProvider>
    </PlatformAdminGate>
  );
}
