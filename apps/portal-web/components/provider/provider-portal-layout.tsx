'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import {
  Bell,
  ClipboardList,
  FileText,
  FolderOpen,
  Home,
  LifeBuoy,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X
} from 'lucide-react';

import type { PortalSessionUser } from '../../lib/portal-session';
import type {
  ProviderPortalConfig,
  ProviderPortalNavIcon
} from '../../config/providerPortalConfig';
import { prefixPreviewHref, stripPreviewHref } from '../../lib/preview-route';
import type { TenantBranding } from '../../lib/tenant-branding';
import type { TenantPortalModuleId } from '../../lib/tenant-modules';
import { isTenantModuleEnabledForUser } from '../../lib/tenant-modules';
import { SignOutButton } from '../sign-out-button';

const NAV_ICON_MAP: Record<ProviderPortalNavIcon, typeof Home> = {
  home: Home,
  'shield-check': ShieldCheck,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  wallet: Wallet,
  users: Users,
  'folder-open': FolderOpen,
  mail: Mail,
  'life-buoy': LifeBuoy,
  settings: Settings
};

const providerNavModuleMap: Record<string, TenantPortalModuleId> = {
  dashboard: 'provider_dashboard',
  eligibility: 'provider_eligibility',
  authorizations: 'provider_authorizations',
  claims: 'provider_claims',
  payments: 'provider_payments',
  patients: 'provider_patients',
  documents: 'provider_documents',
  messages: 'provider_messages',
  support: 'provider_support',
  admin: 'provider_admin'
};

function ProviderSidebar({
  config,
  routePrefix,
  user,
  isMobileOpen,
  collapsed,
  onCloseMobile,
  onToggleCollapse
}: {
  config: ProviderPortalConfig;
  routePrefix?: string;
  user: PortalSessionUser;
  isMobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = stripPreviewHref(routePrefix, usePathname());
  const enabledItems = config.navItems.filter((item) =>
    isTenantModuleEnabledForUser(user, providerNavModuleMap[item.key])
  );

  const links = enabledItems.map((item) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = NAV_ICON_MAP[item.icon];

    return (
        <Link
          key={item.key}
          href={prefixPreviewHref(routePrefix, item.href)}
          onClick={onCloseMobile}
        className={`tenant-provider-sidebar__item ${isActive ? 'tenant-provider-sidebar__item--active' : ''} flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
          isActive
            ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)] text-[var(--tenant-primary-color)]'
            : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-slate-50 hover:text-[var(--text-primary)]'
        }`}
      >
        <Icon size={18} className="tenant-provider-sidebar__icon shrink-0" />
        <span className={`tenant-provider-sidebar__label ${collapsed ? 'portal-sr-only' : 'ml-3'}`}>{item.label}</span>
      </Link>
    );
  });

  return (
    <>
      <aside
        className={`tenant-provider-sidebar tenant-provider-sidebar--desktop hidden border-r border-[var(--border-subtle)] bg-white lg:block ${
          collapsed ? 'w-[84px]' : 'w-[240px]'
        }`}
      >
        <div className="tenant-provider-sidebar__inner sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="tenant-provider-sidebar__toggle mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={16} />
          </button>
          <nav aria-label="Provider navigation" className="tenant-provider-sidebar__nav space-y-1">
            {links}
          </nav>
        </div>
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label="Close navigation drawer"
            onClick={onCloseMobile}
          />
          <aside className="tenant-provider-sidebar tenant-provider-sidebar--mobile relative h-full w-[290px] border-r border-[var(--border-subtle)] bg-white p-4 shadow-xl">
            <div className="tenant-provider-sidebar__mobile-header mb-4 flex items-center justify-between">
              <p className="tenant-provider-sidebar__mobile-title text-sm font-semibold text-[var(--text-primary)]">Provider navigation</p>
              <button
                type="button"
                onClick={onCloseMobile}
                className="tenant-provider-sidebar__close inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            </div>
            <nav aria-label="Provider navigation" className="tenant-provider-sidebar__nav space-y-1">
              {links}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function ProviderPortalLayout({
  branding,
  config,
  children,
  routePrefix,
  searchBasePath,
  user
}: {
  branding: TenantBranding;
  config: ProviderPortalConfig;
  children: ReactNode;
  routePrefix?: string;
  searchBasePath: string;
  user: PortalSessionUser;
}) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;

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
      <header className="tenant-provider-header sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-white/95 backdrop-blur">
        <div className="tenant-provider-header__inner portal-fluid-shell mx-auto w-full max-w-[1600px] px-5 py-4 md:px-7">
          <div className="tenant-provider-header__content flex items-center gap-3">
            <button
              type="button"
              className="tenant-provider-header__menu inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] lg:hidden"
              aria-label="Open provider navigation"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <a href={prefixPreviewHref(routePrefix, '/provider/dashboard')} className="tenant-provider-header__brand flex items-center gap-3">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.displayName} logo`}
                  className="tenant-provider-header__logo h-9 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div
                  className="tenant-provider-header__logo-fallback flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {branding.displayName
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
                </div>
              )}
            </a>

            <form action={searchBasePath} method="get" className="tenant-provider-header__search min-w-0 flex-1" role="search">
              <input
                name="q"
                placeholder="Search patients, claims, authorizations..."
                className="tenant-provider-header__search-input portal-input h-10 rounded-xl px-3 text-sm"
              />
            </form>

            <button
              type="button"
              className="tenant-provider-header__notifications relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              aria-label="Provider notifications"
            >
              <Bell size={18} />
              <span className="tenant-provider-header__notification-count absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-1 text-xs font-semibold text-white">
                {config.notifications.length}
              </span>
            </button>

            <div className="tenant-provider-header__user hidden items-center gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 md:flex">
              <div
                className="tenant-provider-header__avatar flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {initials}
              </div>
              <div className="tenant-provider-header__user-copy leading-tight">
                <p className="tenant-provider-header__user-name text-sm font-semibold text-[var(--text-primary)]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="tenant-provider-header__user-role text-xs text-[var(--text-muted)]">{config.providerRoleLabel}</p>
              </div>
            </div>

            <div className="tenant-provider-header__actions">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="tenant-provider-shell portal-fluid-shell mx-auto flex w-full max-w-[1600px]">
        <ProviderSidebar
          config={config}
          routePrefix={routePrefix}
          user={user}
          isMobileOpen={isMobileSidebarOpen}
          collapsed={collapsed}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />

        <div className="tenant-provider-shell__main min-w-0 flex-1 px-5 pb-7 pt-5 md:px-7 md:pb-9 lg:px-10 lg:pt-7">
          <main id="main-content" className="tenant-provider-shell__main-content min-w-0 space-y-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
