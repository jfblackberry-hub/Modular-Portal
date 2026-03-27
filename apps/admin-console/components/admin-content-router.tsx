'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { getAdminRouteContext } from './admin-route-config';
import { useAdminSession } from './admin-session-provider';
import { useAdminTenantContext } from './admin-tenant-context-provider';

type AdminContentRouterProps = {
  children: ReactNode;
};

export function AdminContentRouter({ children }: AdminContentRouterProps) {
  const pathname = usePathname();
  const { session } = useAdminSession();
  const { selectedTenant, developerMode } = useAdminTenantContext();
  const routeContext = getAdminRouteContext(pathname, session, {
    selectedTenant,
    developerMode
  });
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <main ref={containerRef} className="admin-content-router min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-admin-bg">
      <div className="admin-content-router__frame">
        <div className="admin-content-router__context admin-surface">
          <div className="admin-content-router__context-row">
            <div className="admin-content-router__breadcrumbs">
              <Link href={routeContext?.roleHref ?? '/admin'} className="admin-content-router__context-pill admin-content-router__context-pill--link">
                {routeContext?.roleLabel ?? 'Admin'}
              </Link>
              <Link
                href={routeContext?.sectionHref ?? routeContext?.roleHref ?? '/admin'}
                className="admin-content-router__context-pill admin-content-router__context-pill--link"
              >
                {routeContext?.sectionLabel ?? 'Workspace'}
              </Link>
              <Link
                href={routeContext?.route.href ?? '#'}
                className="admin-content-router__context-pill admin-content-router__context-pill--link"
              >
                {routeContext?.route.label ?? 'Admin workspace'}
              </Link>
              <span className="admin-content-router__context-note">
                {routeContext?.route.description ?? 'Select an admin workspace route from the left menu.'}
              </span>
            </div>
          </div>
        </div>
        <div className="admin-content-router__body">{children}</div>
      </div>
    </main>
  );
}
