'use client';

import { useRouter } from 'next/navigation';

import type { AdminSession } from './admin-session-provider';

type TopHeaderProps = {
  session: AdminSession | null;
  signOut: () => void;
};

export function TopHeader({ session, signOut }: TopHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-admin-border bg-admin-panel/95 px-8 py-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-admin-accent">
            Admin Workspace
          </p>
          <p className="mt-2 text-sm text-admin-muted">
            Persistent operations shell for platform and tenant administration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm text-admin-muted">
            {session ? session.email : 'Admin session required'}
          </div>

          {session ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                router.replace('/login');
              }}
              className="rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-medium text-admin-muted transition hover:border-admin-accent hover:text-admin-text"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
