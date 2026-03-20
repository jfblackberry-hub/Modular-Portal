import Link from 'next/link';

const adminOptions = [
  {
    label: 'Blue Horizon Tenant Admin',
    description: 'Open tenant operations for the Blue Horizon Health payer tenant.',
    href: 'http://localhost:3003/login?admin_user_id=tenant&admin_email=tenant&redirect=%2Fadmin%2Ftenant%2Fhealth'
  },
  {
    label: 'Real Health Tenant Admin',
    description: 'Open tenant operations for the Real Health payer tenant.',
    href: 'http://localhost:3003/login?admin_user_id=realtenantadmin&admin_email=realtenantadmin&redirect=%2Fadmin%2Ftenant%2Fhealth'
  },
  {
    label: 'Platform Admin',
    description: 'Open platform-wide operations for tenants, governance, and system health.',
    href: 'http://localhost:3003/login?admin_user_id=admin&admin_email=admin&redirect=%2Fadmin%2Fplatform%2Fhealth'
  }
];

const featureCards = [
  {
    title: 'Benefits and coverage',
    description: 'Explain plan details, deductible progress, and care access in clear member language.'
  },
  {
    title: 'Claims and documents',
    description: 'Surface the most important status information above the fold with simple cards and guided detail.'
  },
  {
    title: 'Support and navigation',
    description: 'Help members find providers, send messages, pay bills, and contact support without friction.'
  }
];

const portalSignInLinks = [
  {
    label: 'Member Portal',
    description: 'Open the member dashboard with coverage, claims, benefits, and ID card tools.',
    href: '/login?user=maria&redirect=/dashboard&auto=1',
    loginLabel: 'Maria login'
  },
  {
    label: 'Provider Portal',
    description: 'Go directly to provider operations for eligibility, claims, authorizations, and payments.',
    href: '/provider-login?user=Provider1&redirect=/provider/dashboard&auto=1',
    loginLabel: 'Dr. Lee login'
  },
  {
    label: 'Employer Portal',
    description: 'Enter the employer workspace for census, enrollment, billing, and documents.',
    href: '/employer-login',
    loginLabel: ''
  },
  {
    label: 'Broker Portal',
    description: 'Launch the broker workspace for book of business, renewals, quotes, and commissions.',
    href: '/login?user=william.schultz&redirect=/broker&auto=1',
    loginLabel: 'William Schultz login'
  },
  {
    label: 'Shop and Enroll',
    description: 'Open the shop and enroll individual portal in one click.',
    href: '/login?user=chris&redirect=/individual&auto=1',
    loginLabel: 'Chris login'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
            A modern healthcare member portal experience for local development.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            The default shell now follows familiar payer patterns: light
            surfaces, trusted blue accents, quick member tasks, and clear
            support paths.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
            >
              Manual login
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {portalSignInLinks.map((portal) => (
            <article
              key={portal.label}
              className="portal-card flex min-h-[148px] flex-col justify-between p-6 transition hover:border-[var(--tenant-primary-color)]"
            >
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {portal.label}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  {portal.description}
                </p>
              </div>
              {portal.label === 'Employer Portal' ? (
                <div className="mt-5 grid gap-2">
                  <Link
                    href="/employer-login?user=EMP-0316043829906172-001&redirect=/employer&auto=1"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Northstar login
                  </Link>
                  <Link
                    href="/employer-login?user=EMP-0316043829906172-002&redirect=/employer&auto=1"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]"
                  >
                    Lakeside login
                  </Link>
                </div>
              ) : (
                <Link
                  href={portal.href}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {portal.loginLabel}
                </Link>
              )}
            </article>
          ))}
        </div>

        <section className="mt-14 rounded-[28px] border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">
              Administration
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
              Admin console access
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Use the admin console to manage tenant operations or platform-wide administration.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adminOptions.map((option) => (
              <Link
                key={option.label}
                href={option.href}
                className="portal-card flex min-h-[152px] flex-col justify-between p-6 transition hover:border-[var(--tenant-primary-color)]"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {option.label}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {option.description}
                  </p>
                </div>
                <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]">
                  Open admin console
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="portal-card p-6"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
