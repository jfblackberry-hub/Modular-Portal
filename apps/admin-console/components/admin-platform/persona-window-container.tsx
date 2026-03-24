'use client';

import {
  getPersonaLabel,
  type PersonaSession
} from '../../lib/admin-platform-sessions';

function buildWorkspaceUrl(session: PersonaSession) {
  return `/admin/workspace/${session.id}`;
}

export function PersonaWindowContainer({
  activeSessionId,
  onCloseSession,
  onFocusSession,
  sessions
}: {
  activeSessionId: string;
  onCloseSession: (sessionId: string) => void;
  onFocusSession: (sessionId: string) => void;
  sessions: PersonaSession[];
}) {
  if (sessions.length === 0) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-[28px] border border-dashed border-[#2d3f5d] bg-[#0e1726] px-8 py-10 text-center text-slate-300">
        <div>
          <p className="text-lg font-semibold text-white">No persona windows open</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use the selector to create isolated admin workspaces for different
            tenant and persona combinations.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;

        return (
          <section
            key={session.id}
            className={`overflow-hidden rounded-[28px] border transition ${
              isActive
                ? 'border-cyan-400 bg-[#06101d] shadow-[0_28px_80px_rgba(8,18,35,0.42)]'
                : 'border-[#233754] bg-[#0b1422]'
            }`}
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22324b] px-5 py-4">
              <button
                type="button"
                onClick={() => onFocusSession(session.id)}
                className="text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  {getPersonaLabel(session.personaType)}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Tenant {session.tenantId}
                </h3>
                <p className="mt-1 text-sm text-slate-400">User {session.userId}</p>
              </button>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-[#162338] text-slate-300'
                  }`}
                >
                  {isActive ? 'Focused' : 'Contained'}
                </span>
                <button
                  type="button"
                  onClick={() => onCloseSession(session.id)}
                  className="rounded-full border border-[#36506f] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </header>

            <div className="h-[34rem] bg-[#08111d]">
              <iframe
                title={`${session.personaType}-${session.userId}`}
                src={buildWorkspaceUrl(session)}
                className="h-full w-full border-0"
                referrerPolicy="same-origin"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
