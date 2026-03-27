'use client';

import { ChevronRight, LogOut, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { AdminSession } from '../lib/admin-session';
import { portalPublicOrigin } from '../lib/public-runtime';
import { getAdminRouteContext, getDefaultAdminHref } from './admin-route-config';
import { useAdminTenantContext } from './admin-tenant-context-provider';

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
  const { selectedTenant, developerMode, setDeveloperMode } = useAdminTenantContext();
  const routeContext = getAdminRouteContext(pathname, session, {
    selectedTenant,
    developerMode
  });
  const workspaceLabel = session?.isPlatformAdmin ? 'Platform Admin' : 'Tenant Admin';
  const homeHref = session
    ? getDefaultAdminHref(session.isPlatformAdmin, selectedTenant?.id ?? session.tenantId)
    : '/admin';

  return (
    <header className="admin-top-header sticky top-0 z-40 border-b border-admin-border">
      <div className="admin-top-header__content">
        <div className="admin-top-header__brand">
          <div className="admin-top-header__brand-mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- platform logo is served from local static branding assets */}
            <img src="/branding/averra_logo_cutout.svg" alt="" className="admin-brand-logo" />
          </div>
          <div className="admin-top-header__brand-copy">
            <p className="admin-top-header__eyebrow">averra control plane</p>
            <div className="admin-top-header__brand-row">
              <Link href={homeHref} className="admin-top-header__title admin-top-header__title-link">
                averra control plane
              </Link>
              <span className="admin-top-header__divider" aria-hidden="true">
                <ChevronRight size={14} />
              </span>
              <span className="admin-top-header__subtitle">{routeContext?.route.label ?? 'Workspace'}</span>
              {selectedTenant ? (
                <>
                  <span className="admin-top-header__divider" aria-hidden="true">
                    <ChevronRight size={14} />
                  </span>
                  <span className="admin-top-header__subtitle">{selectedTenant.name}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="admin-top-header__profile">
          {session?.isPlatformAdmin ? (
            <button
              type="button"
              onClick={() => setDeveloperMode(!developerMode)}
              className="admin-button admin-button--secondary"
            >
              {developerMode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              <span>Developer Mode</span>
            </button>
          ) : null}
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
