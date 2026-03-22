'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';

import type { PortalSessionUser } from '../../lib/portal-session';
import type { TenantBranding } from '../../lib/tenant-branding';
import { Header } from './header';
import { Sidebar } from './sidebar';

export function PortalLayout({
  branding,
  children,
  routePrefix,
  searchBasePath,
  user
}: {
  branding: TenantBranding;
  children: ReactNode;
  routePrefix?: string;
  searchBasePath: string;
  user: PortalSessionUser;
}) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]"
      style={
        {
          '--tenant-font': branding.fontFamily,
          '--tenant-primary': branding.primaryColor,
          '--tenant-secondary': branding.secondaryColor,
          '--tenant-primary-color': branding.primaryColor,
          '--tenant-primary-soft-color': branding.primarySoftColor,
          '--tenant-secondary-color': branding.secondaryColor,
          '--tenant-secondary-soft-color': branding.secondarySoftColor
        } as CSSProperties
      }
    >
      <Header
        branding={branding}
        user={user}
        routePrefix={routePrefix}
        searchBasePath={searchBasePath}
        onMenuClick={() => setMobileSidebarOpen(true)}
      />

      <div className="portal-fluid-shell mx-auto flex w-full max-w-[1600px]">
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          routePrefix={routePrefix}
          user={user}
        />

        <main id="main-content" className="min-w-0 flex-1 p-5 lg:p-10">
          {children}
        </main>
      </div>

      <footer className="border-t border-[var(--border-subtle)] bg-white">
        <div className="portal-fluid-shell mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-5 py-5 text-sm text-[var(--text-secondary)] md:px-7">
          <p className="font-semibold text-[var(--text-primary)]">
            {branding.displayName} member portal
          </p>
          <p>
            Support for {user.tenant.name}. For help, contact{' '}
            {branding.supportEmail ? (
              <a href={`mailto:${branding.supportEmail}`} className="font-medium">
                {branding.supportEmail}
              </a>
            ) : (
              'your support team'
            )}
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
