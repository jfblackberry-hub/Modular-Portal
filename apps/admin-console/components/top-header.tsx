'use client';

import { ChevronRight, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { portalPublicOrigin } from '../lib/public-runtime';
import type { AdminSession } from '../lib/admin-session';
import { getAdminRouteContext, getDefaultAdminHref } from './admin-route-config';

type TopHeaderProps = {
  session: AdminSession | null;
  signOut: () => Promise<void>;
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
              onClick={async () => {
                try {
                  await signOut();
                  window.location.assign(`${portalPublicOrigin}/login`);
                } catch {
                  return;
                }
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
