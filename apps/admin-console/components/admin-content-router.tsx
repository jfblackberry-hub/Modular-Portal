'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { getAdminRouteContext } from './admin-route-config';

type AdminContentRouterProps = {
  children: ReactNode;
};

export function AdminContentRouter({ children }: AdminContentRouterProps) {
  const pathname = usePathname();
  const routeContext = getAdminRouteContext(pathname);
  const containerRef = useRef<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedZoom = window.sessionStorage.getItem('admin-content-zoom');

    if (storedZoom) {
      const nextZoom = Number(storedZoom);

      if (!Number.isNaN(nextZoom)) {
        setZoom(nextZoom);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem('admin-content-zoom', String(zoom));
  }, [zoom]);

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

            <div className="admin-content-router__zoom-controls" aria-label="Main content zoom controls">
              <span className="admin-content-router__zoom-label">Zoom</span>
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setZoom((current) => Math.max(90, current - 10))}
              >
                A-
              </button>
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setZoom(100)}
              >
                {zoom}%
              </button>
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setZoom((current) => Math.min(160, current + 10))}
              >
                A+
              </button>
            </div>
          </div>
        </div>

        <div className="admin-content-router__zoom-frame">
          <div
            className="admin-content-router__body"
            style={{ zoom: `${zoom}%` }}
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
