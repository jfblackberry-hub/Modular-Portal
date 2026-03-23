'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  createPersonaSession,
  type PersonaSession,
  type PersonaSessionDraft,
  readActivePersonaSessionId,
  readStoredPersonaSessions,
  storeActivePersonaSessionId,
  storePersonaSessions} from '../../lib/admin-platform-sessions';

type AdminPlatformSessionManagerValue = {
  activeSessionId: string;
  sessions: PersonaSession[];
  addSession: (draft: PersonaSessionDraft) => PersonaSession;
  removeSession: (sessionId: string) => PersonaSession | null;
  setActiveSession: (sessionId: string) => PersonaSession | null;
};

const AdminPlatformSessionManagerContext =
  createContext<AdminPlatformSessionManagerValue>({
    activeSessionId: '',
    sessions: [],
    addSession: () => {
      throw new Error('AdminPlatformSessionManagerProvider not initialized.');
    },
    removeSession: () => null,
    setActiveSession: () => null
  });

export function AdminPlatformSessionManagerProvider({
  children
}: {
  children: ReactNode;
}) {
  const [sessions, setSessions] = useState<PersonaSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');

  useEffect(() => {
    const storedSessions = readStoredPersonaSessions();
    const storedActiveSessionId = readActivePersonaSessionId();

    setSessions(storedSessions);
    setActiveSessionId(
      storedSessions.some((session) => session.id === storedActiveSessionId)
        ? storedActiveSessionId
        : storedSessions[0]?.id ?? ''
    );
  }, []);

  useEffect(() => {
    storePersonaSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    storeActivePersonaSessionId(activeSessionId);
  }, [activeSessionId]);

  const value = useMemo<AdminPlatformSessionManagerValue>(
    () => ({
      activeSessionId,
      sessions,
      addSession(draft) {
        const nextSession = createPersonaSession(draft);

        setSessions((current) => [nextSession, ...current]);
        setActiveSessionId(nextSession.id);
        return nextSession;
      },
      removeSession(sessionId) {
        const removedSession =
          sessions.find((session) => session.id === sessionId) ?? null;

        setSessions((current) => {
          const nextSessions = current.filter((session) => session.id !== sessionId);

          setActiveSessionId((currentActive) =>
            currentActive === sessionId
              ? nextSessions[0]?.id ?? ''
              : currentActive
          );

          return nextSessions;
        });

        return removedSession;
      },
      setActiveSession(sessionId) {
        const nextActiveSession =
          sessions.find((session) => session.id === sessionId) ?? null;
        if (nextActiveSession) {
          setActiveSessionId(sessionId);
        }
        return nextActiveSession;
      }
    }),
    [activeSessionId, sessions]
  );

  return (
    <AdminPlatformSessionManagerContext.Provider value={value}>
      {children}
    </AdminPlatformSessionManagerContext.Provider>
  );
}

export function useAdminPlatformSessionManager() {
  return useContext(AdminPlatformSessionManagerContext);
}
