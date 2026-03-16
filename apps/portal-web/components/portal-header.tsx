import type { PortalSessionUser } from '../lib/portal-session';
import type { TenantBranding } from '../lib/tenant-branding';
import { SignOutButton } from './sign-out-button';

export function PortalHeader({
  branding,
  user
}: {
  branding: TenantBranding;
  user: PortalSessionUser;
}) {
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;

  return (
    <header className="border-b border-[var(--border-subtle)] bg-white">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--tenant-primary-soft-color)]/35">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-5 rounded-[28px] border border-[var(--border-subtle)] bg-white px-5 py-5 shadow-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-5">
              {branding.logoUrl ? (
                <div className="flex h-24 w-full max-w-[16rem] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-white px-5 py-4 sm:h-28 sm:max-w-[20rem]">
                  <img
                    src={branding.logoUrl}
                    alt={`${branding.displayName} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {branding.displayName
                    .split(' ')
                    .map((segment) => segment[0])
                    .join('')
                    .slice(0, 2)}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                    {branding.displayName}
                  </h1>
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-semibold text-[var(--tenant-primary-color)]"
                    style={{ backgroundColor: 'var(--tenant-primary-soft-color)' }}
                  >
                    {branding.badgeLabel}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                  {branding.welcomeText ??
                    'Use your health plan benefits, claims, ID card, and support resources in one secure portal.'}
                </p>
                {branding.experience === 'member' ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <p>
                      <span className="font-semibold text-[var(--text-primary)]">Employer / Group:</span>{' '}
                      {branding.employerGroupName ?? user.tenant.name}
                    </p>
                    <span className="hidden text-[var(--text-muted)] sm:inline">•</span>
                    <p>
                      <span className="font-semibold text-[var(--text-primary)]">Plan:</span>{' '}
                      {branding.planName ?? `${branding.employerGroupName ?? user.tenant.name} Gold PPO`}
                    </p>
                  </div>
                ) : null}
                <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
                  {branding.supportLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {user.roles.join(', ') || 'Member user'}
                    </p>
                  </div>
                </div>
                <SignOutButton />
              </div>

            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
