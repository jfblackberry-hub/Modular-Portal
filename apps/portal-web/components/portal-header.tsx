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
  const isEmployerExperience = branding.experience === 'employer';
  const isBrokerExperience = branding.experience === 'broker';
  const isMemberExperience = branding.experience === 'member';
  const headerMaxWidth = isBrokerExperience ? 'max-w-[1560px]' : 'max-w-7xl';
  const employerName = branding.employerGroupName ?? branding.displayName;
  const employerLogoUrl = branding.employerGroupLogoUrl ?? branding.logoUrl;
  const brokerName = branding.displayName;
  const payerName = branding.payerDisplayName ?? 'Health Plan';
  const payerLogoUrl = branding.payerLogoUrl;
  const primaryHeaderLogoUrl = isMemberExperience ? payerLogoUrl ?? branding.logoUrl : branding.logoUrl;

  return (
    <header className="tenant-portal-header border-b border-[var(--border-subtle)] bg-white">
      <div className="tenant-portal-header__band border-b border-[var(--border-subtle)] bg-[var(--tenant-primary-soft-color)]/35">
        <div className={`mx-auto ${headerMaxWidth} px-4 py-5 sm:px-6`}>
          <div className="tenant-portal-header__shell flex flex-col gap-5 rounded-[32px] border border-[var(--border-subtle)] bg-white px-6 py-5 shadow-sm sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-6">
            <div className="tenant-portal-header__content flex items-center gap-5">
              {isEmployerExperience ? (
                <div className="flex flex-col gap-3">
                  <div className="tenant-portal-header__logo-frame flex h-32 w-full max-w-[30rem] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-white px-6 py-3">
                    {payerLogoUrl ? (
                      <img
                        src={payerLogoUrl}
                        alt={`${payerName} logo`}
                        className="h-28 w-auto max-w-[98%] object-contain"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {payerName}
                      </span>
                    )}
                  </div>
                  <div className="tenant-portal-header__logo-frame flex h-32 w-full max-w-[30rem] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-white px-6 py-3">
                    {employerLogoUrl ? (
                      <img
                        src={employerLogoUrl}
                        alt={`${employerName} logo`}
                        className="h-28 w-auto max-w-[98%] object-contain"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {employerName}
                      </span>
                    )}
                  </div>
                </div>
              ) : isBrokerExperience ? (
                <div className="tenant-portal-header__logo-frame flex h-32 w-full max-w-[34rem] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-white px-7 py-4 sm:max-w-[38rem]">
                  {payerLogoUrl ? (
                    <img
                      src={payerLogoUrl}
                      alt={`${payerName} logo`}
                      className="h-28 w-auto max-w-[98%] object-contain"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {payerName}
                    </span>
                  )}
                </div>
              ) : primaryHeaderLogoUrl ? (
                <div className="tenant-portal-header__logo-frame flex h-32 w-full max-w-[34rem] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-white px-7 py-4 sm:max-w-[38rem]">
                  <img
                    src={primaryHeaderLogoUrl}
                    alt={`${branding.displayName} logo`}
                    className="h-28 w-auto max-w-[98%] object-contain"
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

              <div className="tenant-portal-header__text">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="tenant-portal-header__title text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                    {isEmployerExperience || isBrokerExperience ? payerName : branding.displayName}
                  </h1>
                </div>
                {isEmployerExperience ? (
                  <div className="tenant-portal-header__meta mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <p>
                      <span className="font-semibold text-[var(--text-primary)]">Payer:</span>{' '}
                      {payerName}
                    </p>
                    <span className="hidden text-[var(--text-muted)] sm:inline">•</span>
                    <p>
                      <span className="font-semibold text-[var(--text-primary)]">
                        Employer / Group:
                      </span>{' '}
                      {employerName}
                    </p>
                  </div>
                ) : isBrokerExperience ? (
                  <div className="tenant-portal-header__meta mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <p>
                      <span className="font-semibold text-[var(--text-primary)]">Payer:</span>{' '}
                      {payerName}
                    </p>
                    <span className="hidden text-[var(--text-muted)] sm:inline">•</span>
                    <p>
                      <span className="font-semibold text-[var(--text-primary)]">Broker:</span>{' '}
                      {brokerName}
                    </p>
                  </div>
                ) : null}
                <p className="tenant-portal-header__welcome mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                  {branding.welcomeText ??
                    'Use your health plan benefits, claims, ID card, and support resources in one secure portal.'}
                </p>
                {branding.experience === 'member' ? (
                  <div className="tenant-portal-header__meta mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
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
                <p className="tenant-portal-header__support mt-2 text-sm font-medium text-[var(--text-secondary)]">
                  {branding.supportLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {isBrokerExperience || branding.experience === 'member' ? null : (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
