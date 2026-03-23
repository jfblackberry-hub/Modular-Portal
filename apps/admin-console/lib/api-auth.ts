import { apiPublicOrigin, defaultAdminUserId } from './public-runtime';

export const apiBaseUrl = apiPublicOrigin;

export const ADMIN_USER_ID_STORAGE_KEY = 'admin-console-user-id';
export const ADMIN_USER_EMAIL_STORAGE_KEY = 'admin-console-user-email';
export const ADMIN_AUTH_TOKEN_STORAGE_KEY = 'admin-console-auth-token';
export const ADMIN_SESSION_STORAGE_KEY = 'admin-console-session';

function getAdminBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
}

export function getStoredAdminUserId() {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return defaultAdminUserId;
  }

  return storage.getItem(ADMIN_USER_ID_STORAGE_KEY) ?? defaultAdminUserId ?? '';
}

export function getStoredAdminEmail() {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return '';
  }

  return storage.getItem(ADMIN_USER_EMAIL_STORAGE_KEY) ?? '';
}

export function getAdminAuthHeaders() {
  const headers: Record<string, string> = {};
  const adminAuthToken = getStoredAdminAuthToken();

  if (adminAuthToken) {
    headers.Authorization = `Bearer ${adminAuthToken}`;
  }

  return headers;
}

export function getTenantScopedAdminAuthHeaders(tenantId?: string | null) {
  const headers = getAdminAuthHeaders();
  const normalizedTenantId = tenantId?.trim();

  if (normalizedTenantId) {
    headers['x-tenant-id'] = normalizedTenantId;
    return headers;
  }

  const session = getStoredAdminSessionSnapshot() as
    | {
        tenantId?: string;
        user?: {
          tenantId?: string;
        };
      }
    | null;
  const sessionTenantId =
    session?.tenantId?.trim() ||
    session?.user?.tenantId?.trim() ||
    '';

  if (sessionTenantId) {
    headers['x-tenant-id'] = sessionTenantId;
  }

  return headers;
}

export function getStoredAdminAuthToken() {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return '';
  }

  return storage.getItem(ADMIN_AUTH_TOKEN_STORAGE_KEY) ?? '';
}

export function storeAdminSession(
  user: { id: string; email: string },
  token?: string
) {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return;
  }

  storage.setItem(ADMIN_USER_ID_STORAGE_KEY, user.id);
  storage.setItem(ADMIN_USER_EMAIL_STORAGE_KEY, user.email);
  if (token) {
    storage.setItem(ADMIN_AUTH_TOKEN_STORAGE_KEY, token);
  }
}

export function storeAdminSessionSnapshot(session: unknown) {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return;
  }

  storage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredAdminSessionSnapshot() {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return null;
  }

  const rawSession = storage.getItem(ADMIN_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  const storage = getAdminBrowserStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(ADMIN_USER_ID_STORAGE_KEY);
  storage.removeItem(ADMIN_USER_EMAIL_STORAGE_KEY);
  storage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
  storage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}
