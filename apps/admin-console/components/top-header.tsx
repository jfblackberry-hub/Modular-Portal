'use client';

import Link from 'next/link';
import { ChevronRight, LogOut, Shield } from 'lucide-react';
import { usePathname } from 'next/navigation';

import type { AdminSession } from './admin-session-provider';
import { getAdminRouteContext, getDefaultAdminHref } from './admin-route-config';

const portalBaseUrl = process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'http://localhost:3000';

type TopHeaderProps = {
  session: AdminSession | null;
  signOut: () => void;
};

function getInitials(email: string) {
  return email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export function TopHeader({ session, signOut }: TopHeaderProps) {
  const pathname = usePathname();
  const routeContext = getAdminRouteContext(pathname);
  const workspaceLabel = session?.isPlatformAdmin ? 'Platform Admin' : 'Tenant Admin';
  const homeHref = session ? getDefaultAdminHref(session.isPlatformAdmin) : '/admin';

  return (
    <header className="admin-top-header sticky top-0 z-40 border-b border-admin-border">
      <div className="admin-top-header__content">
        <div className="admin-top-header__brand">
          <div className="admin-top-header__brand-mark" aria-hidden="true">
            <Shield size={18} />
          </div>
          <div className="admin-top-header__brand-copy">
            <p className="admin-top-header__eyebrow">Platform control plane</p>
            <div className="admin-top-header__brand-row">
              <Link href={homeHref} className="admin-top-header__title admin-top-header__title-link">
                Platform Admin
              </Link>
              <span className="admin-top-header__divider" aria-hidden="true">
                <ChevronRight size={14} />
              </span>
              <span className="admin-top-header__subtitle">{routeContext?.route.label ?? 'Workspace'}</span>
            </div>
          </div>
        </div>

        <div className="admin-top-header__profile">
          <div className="admin-top-header__profile-card">
            <div className="admin-top-header__avatar" aria-hidden="true">
              {session ? getInitials(session.email) : 'A'}
            </div>
            <div className="admin-top-header__profile-copy">
              <p className="admin-top-header__profile-name">{session?.email ?? 'Admin session required'}</p>
              <p className="admin-top-header__profile-role">{workspaceLabel}</p>
            </div>
          </div>

          {session ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.assign(`${portalBaseUrl}/login`);
              }}
              className="admin-button admin-button--header"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
