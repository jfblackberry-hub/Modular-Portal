'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { requestAdminLogout } from '../lib/admin-logout';
import {
  clearAdminSession,
  getStoredAdminSessionSnapshot,
  storeAdminSessionSnapshot
} from '../lib/api-auth';
import type { AdminSession } from '../lib/admin-session';
import { hasAdminConsoleAccess } from '../lib/admin-session';

type AdminSessionContextValue = {
  session: AdminSession | null;
  isLoading: boolean;
  error: string;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  applySession: (session: AdminSession) => void;
};

const AdminSessionContext = createContext<AdminSessionContextValue>({
  session: null,
  isLoading: true,
  error: '',
  refreshSession: async () => undefined,
  signOut: async () => undefined,
  applySession: () => undefined
});

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSession = useCallback(async function loadSession() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store'
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to load admin session.');
        setSession(null);
        return;
      }

      const payload = (await response.json()) as AdminSession;

      if (!hasAdminConsoleAccess(payload)) {
        clearAdminSession();
        setSession(null);
        setError('Admin console access is limited to tenant and platform admins.');
        return;
      }

      setSession(payload);
      storeAdminSessionSnapshot(payload);
      setError('');
    } catch {
      setError('Admin session unavailable. Start the local API and try again.');
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      if (!isMounted) {
        return;
      }

      const storedSession = getStoredAdminSessionSnapshot() as AdminSession | null;

      if (storedSession && hasAdminConsoleAccess(storedSession)) {
        setSession(storedSession);
      }

      await loadSession();
    }

    void initializeSession();

    return () => {
      isMounted = false;
    };
  }, [loadSession]);

  const signOut = useCallback(async function signOut() {
    try {
      await requestAdminLogout();
      clearAdminSession();
      setSession(null);
      setError('');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to end the admin session right now.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const applySession = useCallback(function applySession(nextSession: AdminSession) {
    if (!hasAdminConsoleAccess(nextSession)) {
      clearAdminSession();
      setSession(null);
      setError('Admin console access is limited to tenant and platform admins.');
      setIsLoading(false);
      return;
    }

    setSession(nextSession);
    storeAdminSessionSnapshot(nextSession);
    setError('');
    setIsLoading(false);
  }, []);

  return (
    <AdminSessionContext.Provider
      value={{
        session,
        isLoading,
        error,
        refreshSession: loadSession,
        signOut,
        applySession
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
