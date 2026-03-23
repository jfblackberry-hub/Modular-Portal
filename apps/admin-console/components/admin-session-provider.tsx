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
  getAdminAuthHeaders,
  getStoredAdminAuthToken,
  getStoredAdminEmail,
  getStoredAdminSessionSnapshot,
  storeAdminSession,
  storeAdminSessionSnapshot
} from '../lib/api-auth';

export type AdminSession = {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
  isTenantAdmin: boolean;
};

type AdminSessionContextValue = {
  session: AdminSession | null;
  isLoading: boolean;
  error: string;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  applySession: (session: AdminSession) => void;
};

function hasAdminConsoleAccess(session: Pick<
  AdminSession,
  'isPlatformAdmin' | 'isTenantAdmin'
>) {
  return session.isPlatformAdmin || session.isTenantAdmin;
}

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

  const bootstrapAdminToken = useCallback(async () => {
    const snapshot = getStoredAdminSessionSnapshot() as AdminSession | null;
    const fallbackEmail = getStoredAdminEmail();
    const email = snapshot?.email || fallbackEmail;

    if (!email) {
      return false;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: 'demo'
      })
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      token?: string;
      user?: {
        id: string;
        email: string;
        roles: string[];
        permissions: string[];
      };
    };

    if (!payload.token || !payload.user) {
      return false;
    }

    storeAdminSession(
      {
        id: payload.user.id,
        email: payload.user.email
      },
      payload.token
    );

    const nextSession: AdminSession = {
      id: payload.user.id,
      email: payload.user.email,
      tenantId: '',
      roles: payload.user.roles,
      permissions: payload.user.permissions,
      isPlatformAdmin:
        payload.user.roles.includes('platform_admin') ||
        payload.user.roles.includes('platform-admin'),
      isTenantAdmin:
        payload.user.roles.includes('tenant_admin') ||
        payload.user.roles.includes('platform_admin') ||
        payload.user.roles.includes('platform-admin')
    };

    if (!hasAdminConsoleAccess(nextSession)) {
      return false;
    }

    setSession(nextSession);
    storeAdminSessionSnapshot(nextSession);
    return true;
  }, []);

  const loadSession = useCallback(async function loadSession() {
    if (!getStoredAdminAuthToken()) {
      const bootstrapped = await bootstrapAdminToken().catch(() => false);
      if (!bootstrapped) {
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers: getAdminAuthHeaders()
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
  }, [bootstrapAdminToken]);

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
      await requestAdminLogout((input, init) =>
        fetch(input, {
          ...init,
          headers: {
            ...(init?.headers ?? {}),
            ...getAdminAuthHeaders()
          }
        })
      );
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
