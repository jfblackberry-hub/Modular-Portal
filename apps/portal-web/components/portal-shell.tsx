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
      <PortalHeader
        branding={branding}
        user={user}
      />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <SideNavigation branding={branding} sections={navigation} />
        <div className="min-w-0 space-y-4">
          <ContentLayout>{children}</ContentLayout>

          {isMemberExperience ? null : (
            <div className="portal-card flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 xl:w-full xl:max-w-[24rem]">
                <PortalSearchForm searchBasePath={searchBasePath} />
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:ml-auto xl:justify-end">
                {isTenantModuleEnabledForUser(user, 'member_messages') ? (
                  <a
                    href="/dashboard/messages"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
                  >
                    Messages
                  </a>
                ) : null}
                {isTenantModuleEnabledForUser(user, 'member_support') ? (
                  <a
                    href="/dashboard/help"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
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
