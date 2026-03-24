'use client';

import { Bell, Menu } from 'lucide-react';
import Link from 'next/link';

import type { PortalSessionUser } from '../../lib/portal-session';
import { prefixPreviewHref } from '../../lib/preview-route';
import type { TenantBranding } from '../../lib/tenant-branding';
import { SignOutButton } from '../sign-out-button';

export function Header({
  branding,
  onMenuClick,
  routePrefix,
  searchBasePath,
  user
}: {
  branding: TenantBranding;
  onMenuClick: () => void;
  routePrefix?: string;
  searchBasePath: string;
  user: PortalSessionUser;
}) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;
  const homeHref = prefixPreviewHref(routePrefix, '/member');

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 py-3 md:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] lg:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu size={18} />
        </button>

        <Link href={homeHref} className="min-w-0">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- dynamic tenant branding URLs are runtime-configured and not safe to route through next/image without broad remote allowlists */}
                <img
                  src={branding.logoUrl}
                  alt={`${branding.displayName} logo`}
                  className="h-9 w-auto max-w-[140px] object-contain"
                />
              </>
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {branding.displayName
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
            <p className="hidden text-sm font-semibold text-[var(--text-primary)] xl:block">
              {branding.displayName}
            </p>
          </div>
          {branding.experience === 'member' ? (
            <p className="mt-1 hidden truncate text-xs text-[var(--text-muted)] xl:block">
              Employer / Group: {branding.employerGroupName ?? user.tenant.name} • Plan:{' '}
              {branding.planName ?? `${branding.employerGroupName ?? user.tenant.name} Gold PPO`}
            </p>
          ) : null}
        </Link>

        <form
          action={searchBasePath}
          method="get"
          className="min-w-0 flex-1"
          role="search"
          aria-label="Global search"
        >
          <input
            name="q"
            placeholder="Search claims, documents, providers..."
            className="portal-input h-10 rounded-xl px-3 text-sm"
          />
        </form>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)]"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="hidden items-center gap-3 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 md:flex">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-[var(--text-muted)]">Member</p>
          </div>
        </div>

        <SignOutButton />
      </div>
    </header>
  );
}
