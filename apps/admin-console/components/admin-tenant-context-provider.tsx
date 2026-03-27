'use client';

import { usePathname } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { fetchAdminJsonCached } from '../lib/admin-client-data';
import type { AdminSession } from '../lib/admin-session';
import { config, getAdminAuthHeaders } from '../lib/api-auth';

type SelectedTenant = {
  id: string;
  name: string;
  slug: string;
  type: 'PAYER' | 'CLINIC' | 'PHYSICIAN_GROUP' | 'HOSPITAL';
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
};

type AdminTenantContextValue = {
  selectedTenant: SelectedTenant | null;
  selectedTenantId: string | null;
  developerMode: boolean;
  setDeveloperMode: (value: boolean) => void;
};

const AdminTenantContext = createContext<AdminTenantContextValue>({
  selectedTenant: null,
  selectedTenantId: null,
  developerMode: false,
  setDeveloperMode: () => undefined
});

const DEVELOPER_MODE_STORAGE_KEY = 'admin-control-plane:developer-mode';

function readTenantIdFromPath(pathname: string) {
  const match = pathname.match(/^\/admin\/tenants\/([^/]+)/);
  const tenantId = match?.[1];

  if (!tenantId || tenantId === 'create' || tenantId === 'types') {
    return null;
  }

  return tenantId;
}

export function AdminTenantContextProvider({
  session,
  children
}: {
  session: AdminSession | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [selectedTenant, setSelectedTenant] = useState<SelectedTenant | null>(null);
  const [developerMode, setDeveloperMode] = useState(false);

  const selectedTenantId = useMemo(() => {
    const tenantIdFromPath = readTenantIdFromPath(pathname);

    if (tenantIdFromPath) {
      return tenantIdFromPath;
    }

    if (session && !session.isPlatformAdmin && session.tenantId) {
      return session.tenantId;
    }

    return null;
  }, [pathname, session]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY);
    setDeveloperMode(stored === 'true');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      DEVELOPER_MODE_STORAGE_KEY,
      developerMode ? 'true' : 'false'
    );
  }, [developerMode]);

  useEffect(() => {
    let isMounted = true;

    async function loadSelectedTenant() {
      if (!selectedTenantId || !session) {
        if (isMounted) {
          setSelectedTenant(null);
        }
        return;
      }

      try {
        const payload = await fetchAdminJsonCached<SelectedTenant>(
          `${config.apiBaseUrl}/platform-admin/tenants/${selectedTenantId}`,
          {
            headers: getAdminAuthHeaders(),
            ttlMs: 10_000,
            cacheKey: `admin-selected-tenant::${selectedTenantId}`
          }
        );

        if (isMounted) {
          setSelectedTenant(payload);
        }
      } catch {
        if (isMounted) {
          setSelectedTenant(null);
        }
      }
    }

    void loadSelectedTenant();

    return () => {
      isMounted = false;
    };
  }, [selectedTenantId, session]);

  return (
    <AdminTenantContext.Provider
      value={{
        selectedTenant,
        selectedTenantId,
        developerMode,
        setDeveloperMode
      }}
    >
      {children}
    </AdminTenantContext.Provider>
  );
}

export function useAdminTenantContext() {
  return useContext(AdminTenantContext);
}
