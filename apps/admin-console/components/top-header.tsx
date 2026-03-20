'use client';

import { useRouter } from 'next/navigation';

import type { AdminSession } from './admin-session-provider';

const portalBaseUrl =
  process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'http://localhost:3000';

type TopHeaderProps = {
  session: AdminSession | null;
  signOut: () => void;
};

export function TopHeader({ session, signOut }: TopHeaderProps) {
  const router = useRouter();

  return (
    <header className="admin-top-header sticky top-0 z-20 border-b border-admin-border bg-admin-panel/95 px-6 py-4 backdrop-blur xl:px-8">
      <div className="admin-top-header__content flex items-center justify-between gap-4">
        <div className="admin-top-header__brand flex min-w-0 items-center gap-4">
          <div className="admin-top-header__brand-icon" aria-hidden="true">A</div>
          <div className="min-w-0">
            <p className="admin-top-header__eyebrow text-xs font-semibold uppercase tracking-[0.28em] text-admin-accent">
              Admin Workspace
            </p>
            <p className="admin-top-header__description mt-1 text-sm text-admin-muted">
              Operational control plane for platform and tenant administration.
            </p>
          </div>
        </div>

        <div className="admin-top-header__actions flex items-center gap-3">
          <div className="admin-top-header__search hidden items-center gap-3 rounded-full border border-admin-border bg-white px-4 py-2 text-sm text-admin-muted lg:flex">
            <span aria-hidden="true">/</span>
            <span>Search admin workspace</span>
          </div>

          <div className="admin-top-header__status hidden items-center gap-2 rounded-full border border-admin-border bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-admin-muted md:flex">
            <span aria-hidden="true">•</span>
            Live
          </div>

          <div className="admin-top-header__session rounded-full border border-admin-border bg-white px-4 py-2 text-sm text-admin-muted">
            {session ? session.email : 'Admin session required'}
          </div>

          {session ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.assign(`${portalBaseUrl}/login`);
              }}
              className="admin-top-header__signout rounded-full border border-admin-border bg-white px-4 py-2 text-sm font-medium text-admin-muted transition hover:border-admin-accent hover:text-admin-text"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
