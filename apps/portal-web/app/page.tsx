import { cookies } from 'next/headers';
import Link from 'next/link';

import { DemoGate } from '../components/demo-gate';
import { DEMO_ACCESS_COOKIE, findDemoUser } from '../lib/demo-access';
import { config } from '../lib/public-runtime';

const adminOptions = [
  {
    label: 'Blue Horizon Tenant Admin',
    description: 'Open tenant operations for the Blue Horizon Health payer tenant.',
    href: `${config.serviceEndpoints.admin}/login`
  },
  {
    label: 'Real Health Tenant Admin',
    description: 'Open tenant operations for the Real Health payer tenant.',
    href: `${config.serviceEndpoints.admin}/login`
  },
  {
    label: 'Averra Control Center',
    description: 'Open Averra-wide operations for tenants, governance, and system health.',
    href: `${config.serviceEndpoints.admin}/login`
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

async function PortalLandingPage() {
  const cookieStore = await cookies();
  const demoAccessUser = cookieStore.get(DEMO_ACCESS_COOKIE)?.value ?? '';
  const matchedDemoUser = findDemoUser(demoAccessUser);

  return (
    <main className="averra-platform-screen">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <p className="averra-platform-pill px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
            <span className="averra-platform-mark">AV</span>
            Demo Access: {matchedDemoUser?.username ?? demoAccessUser}
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
            <span className="averra-platform-wordmark">Averra</span> platform access for local development.
          </h1>
          <p className="averra-platform-text-muted mt-6 max-w-2xl text-lg leading-8">
            Launch tenant experiences, open the Averra control center, and move between provider, member, employer, and broker surfaces from one platform entry point.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="averra-platform-button averra-platform-button--secondary text-sm"
            >
              Manual login
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {portalSignInLinks.map((portal) => (
            <article
              key={portal.label}
              className="averra-platform-card flex min-h-[148px] flex-col justify-between p-6 transition hover:border-[var(--averra-blue)]"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {portal.label}
                </h2>
                <p className="averra-platform-text-muted mt-3 text-sm leading-6">
                  {portal.description}
                </p>
              </div>
              {portal.label === 'Employer Portal' ? (
                <div className="mt-5 grid gap-2">
                  <Link
                  href="/employer-login?user=EMP-0316043829906172-001&redirect=/employer&auto=1"
                    className="averra-platform-button averra-platform-button--primary text-sm"
                  >
                    Northstar login
                  </Link>
                  <Link
                    href="/employer-login?user=EMP-0316043829906172-002&redirect=/employer&auto=1"
                    className="averra-platform-button averra-platform-button--secondary text-sm"
                  >
                    Lakeside login
                  </Link>
                </div>
              ) : (
                <Link
                  href={portal.href}
                  className="averra-platform-button averra-platform-button--primary mt-5 text-sm"
                >
                  {portal.loginLabel}
                </Link>
              )}
            </article>
          ))}
        </div>

        <section className="averra-platform-card mt-14 p-6 sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--averra-blue)]">
              Administration
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Averra control center access
            </h2>
            <p className="averra-platform-text-muted mt-3 text-sm leading-6">
              Use the Averra control center to manage tenant operations or platform-wide administration.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adminOptions.map((option) => (
              <Link
                key={option.label}
                href={option.href}
                className="averra-platform-card flex min-h-[152px] flex-col justify-between p-6 transition hover:border-[var(--averra-blue)]"
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    {option.label}
                  </h3>
                  <p className="averra-platform-text-muted mt-3 text-sm leading-6">
                    {option.description}
                  </p>
                </div>
                <span className="averra-platform-button averra-platform-button--secondary mt-5 text-sm">
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
              className="averra-platform-card p-6"
            >
              <h2 className="text-xl font-semibold">
                {card.title}
              </h2>
              <p className="averra-platform-text-muted mt-3 text-sm leading-6">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const demoAccessCookie = cookieStore.get(DEMO_ACCESS_COOKIE)?.value ?? '';

  if (!findDemoUser(demoAccessCookie)) {
    return <DemoGate />;
  }

  return <PortalLandingPage />;
}
