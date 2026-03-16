'use client';

export function SignOutButton() {
  async function handleSignOut() {
    localStorage.removeItem('portal-token');
    localStorage.removeItem('portal-user');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store'
      });
    } catch {
      // Ignore logout endpoint errors and continue redirect.
    }
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
