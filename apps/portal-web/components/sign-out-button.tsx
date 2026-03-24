'use client';

import { useState } from 'react';

import { requestPortalLogout } from '../lib/portal-logout';
import {
  LEGACY_PORTAL_SESSION_COOKIE,
  LEGACY_PORTAL_TOKEN_COOKIE,
  LEGACY_PORTAL_USER_COOKIE
} from '../lib/session-constants';

export function SignOutButton() {
  const [error, setError] = useState('');

  async function handleSignOut() {
    setError('');
    try {
      await requestPortalLogout();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to sign out right now.'
      );
      return;
    }

    localStorage.removeItem(LEGACY_PORTAL_TOKEN_COOKIE);
    localStorage.removeItem(LEGACY_PORTAL_USER_COOKIE);
    document.cookie = `${LEGACY_PORTAL_SESSION_COOKIE}=; Max-Age=0; path=/`;
    window.location.assign('/');
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          void handleSignOut();
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
        aria-label="Sign out of the portal"
      >
        Sign out
      </button>
    </div>
  );
}
