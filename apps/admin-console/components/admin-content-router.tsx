'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { getAdminRouteContext } from './admin-route-config';

type AdminContentRouterProps = {
  children: ReactNode;
};

export function AdminContentRouter({ children }: AdminContentRouterProps) {
  const pathname = usePathname();
  const routeContext = getAdminRouteContext(pathname);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <main ref={containerRef} className="admin-content-router min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-admin-bg">
      <div className="admin-content-router__frame">
        <div className="admin-content-router__context admin-surface">
          <div className="admin-content-router__breadcrumbs">
            <span className="admin-content-router__breadcrumb">
              {routeContext?.roleLabel ?? 'Admin'}
            </span>
            <span className="admin-content-router__separator">/</span>
            <span className="admin-content-router__breadcrumb">
              {routeContext?.sectionLabel ?? 'Workspace'}
            </span>
          </div>
          <div className="admin-content-router__summary">
            <p className="admin-content-router__title">
              {routeContext?.route.label ?? 'Admin workspace'}
            </p>
            <p className="admin-content-router__description">
              {routeContext?.route.description ?? 'Select an admin workspace route from the left menu.'}
            </p>
          </div>
        </div>

        <div className="admin-content-router__body">{children}</div>
      </div>
    </main>
  );
}
