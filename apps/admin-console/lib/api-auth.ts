export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';

export const ADMIN_USER_ID_STORAGE_KEY = 'admin-console-user-id';
export const ADMIN_USER_EMAIL_STORAGE_KEY = 'admin-console-user-email';
export const ADMIN_SESSION_STORAGE_KEY = 'admin-console-session';

export function getStoredAdminUserId() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_ADMIN_USER_ID ?? '';
  }

  return (
    window.localStorage.getItem(ADMIN_USER_ID_STORAGE_KEY) ??
    process.env.NEXT_PUBLIC_ADMIN_USER_ID ??
    ''
  );
}

export function getAdminAuthHeaders() {
  const headers: Record<string, string> = {};
  const adminUserId = getStoredAdminUserId();

  if (adminUserId) {
    headers['x-user-id'] = adminUserId;
  }

  return headers;
}

export function storeAdminSession(user: { id: string; email: string }) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_USER_ID_STORAGE_KEY, user.id);
  window.localStorage.setItem(ADMIN_USER_EMAIL_STORAGE_KEY, user.email);
}

export function storeAdminSessionSnapshot(session: unknown) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredAdminSessionSnapshot() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

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
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ADMIN_USER_ID_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_USER_EMAIL_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}
