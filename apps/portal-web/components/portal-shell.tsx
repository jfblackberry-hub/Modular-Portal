import type { CSSProperties } from 'react';

import type { PortalNavigationSection } from '../lib/navigation';
import { resolvePortalExperience } from '../lib/portal-experience';
import type { PortalSessionUser } from '../lib/portal-session';
import type { TenantBranding } from '../lib/tenant-branding';
import { isTenantModuleEnabledForUser } from '../lib/tenant-modules';
import { ContentLayout } from './content-layout';
import { PortalFooter } from './portal-footer';
import { PortalHeader } from './portal-header';
import { PortalSearchForm } from './portal-search-form';
import { SideNavigation } from './side-navigation';
import { SignOutButton } from './sign-out-button';
import { TenantTheme } from './tenant-theme';

export function PortalShell({
  branding,
  children,
  navigation,
  searchBasePath,
  user
}: Readonly<{
  branding: TenantBranding;
  children: React.ReactNode;
  navigation: PortalNavigationSection[];
  searchBasePath: string;
  user: PortalSessionUser;
}>) {
  const isMemberExperience = resolvePortalExperience(user) === 'member';
  const isBrokerExperience = branding.experience === 'broker';
  const shellMaxWidth = isBrokerExperience ? 'max-w-[1560px]' : 'max-w-7xl';
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
      <a href="#main-content" className="portal-skip-link">
        Skip to main content
      </a>
      <TenantTheme branding={branding} />
      {isBrokerExperience || isMemberExperience ? (
        <header className="tenant-utility-bar border-b border-[var(--border-subtle)] bg-white/95 backdrop-blur">
          <div className={`tenant-utility-bar__inner mx-auto ${shellMaxWidth} px-4 py-3 sm:px-6`}>
            <div className="tenant-utility-bar__content flex items-center gap-3">
              <div className="tenant-utility-bar__search min-w-0 flex-1">
                <PortalSearchForm searchBasePath={searchBasePath} />
              </div>

              <div className="tenant-utility-bar__user hidden items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-1.5 md:flex">
                <div
                  className="tenant-utility-bar__avatar flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {initials}
                </div>
                <div className="tenant-utility-bar__user-copy leading-tight">
                  <p className="tenant-utility-bar__user-name text-sm font-semibold text-[var(--text-primary)]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="tenant-utility-bar__user-role text-xs text-[var(--text-muted)]">
                    {user.roles.join(', ') || 'Broker user'}
                  </p>
                </div>
              </div>

              <div className="tenant-utility-bar__actions">
                <SignOutButton />
              </div>
            </div>
          </div>
        </header>
      ) : null}
      <PortalHeader
        branding={branding}
        user={user}
      />
      <div className={`tenant-portal-shell__content mx-auto grid ${shellMaxWidth} gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start`}>
        <SideNavigation branding={branding} sections={navigation} />
        <div className="tenant-portal-shell__main min-w-0 space-y-4">
          <ContentLayout>{children}</ContentLayout>

          {isMemberExperience || isBrokerExperience ? null : (
            <div className="tenant-portal-shell__support-bar portal-card flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="tenant-portal-shell__support-search min-w-0 xl:w-full xl:max-w-[24rem]">
                <PortalSearchForm searchBasePath={searchBasePath} />
              </div>

              <div className="tenant-portal-shell__support-actions flex flex-wrap items-center gap-3 xl:ml-auto xl:justify-end">
                {isTenantModuleEnabledForUser(user, 'member_messages') ? (
                  <a
                    href="/dashboard/messages"
                    className="tenant-portal-shell__support-link inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
                  >
                    Messages
                  </a>
                ) : null}
                {isTenantModuleEnabledForUser(user, 'member_support') ? (
                  <a
                    href="/dashboard/help"
                    className="tenant-portal-shell__support-link inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
                  >
                    Help
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
      <PortalFooter branding={branding} user={user} />
    </div>
  );
}
