'use client';

import {
  PORTAL_TOKEN_COOKIE,
  PORTAL_USER_COOKIE
} from '../lib/session-constants';

export function SignOutButton() {
  function handleSignOut() {
    localStorage.removeItem('portal-token');
    localStorage.removeItem('portal-user');
    document.cookie = `${PORTAL_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${PORTAL_USER_COOKIE}=; path=/; max-age=0; samesite=lax`;
    window.location.assign('/login');
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
      aria-label="Sign out of the portal"
    >
      Sign out
    </button>
  );
}
