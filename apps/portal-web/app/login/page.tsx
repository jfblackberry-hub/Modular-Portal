import { LoginForm } from './login-form';

type QuickSignInUser = {
  label: string;
  username: string;
  href?: string;
};

type QuickSignInGroup = {
  title: string;
  users: QuickSignInUser[];
};

const quickSignInGroups: QuickSignInGroup[] = [
  {
    title: 'Member',
    users: [
      { label: 'Portal member', username: 'maria' },
      { label: 'Real Health SQL member', username: 'm0000002' },
      { label: 'Real Health demo member', username: 'realmember' }
    ]
  },
  {
    title: 'Provider',
    users: [
      { label: 'Dr. Lee', username: 'Provider1', href: '/provider-login' }
    ]
  },
  {
    title: 'Administrative',
    users: [
      { label: 'Blue Horizon tenant admin', username: 'tenant' },
      { label: 'Real Health tenant admin', username: 'realtenantadmin' },
      { label: 'Platform admin', username: 'admin' }
    ]
  },
  {
    title: 'Enrollment and Benefits',
    users: [
      {
        label: 'Employer portal',
        username: 'EMP-0316043829906172-001',
        href: '/login?user=EMP-0316043829906172-001&redirect=/employer&auto=1'
      },
      {
        label: 'Northstar employer admin',
        username: 'EMP-0316043829906172-001',
        href: '/login?user=EMP-0316043829906172-001&redirect=/employer&auto=1'
      },
      {
        label: 'Lakeside employer admin',
        username: 'EMP-0316043829906172-002',
        href: '/login?user=EMP-0316043829906172-002&redirect=/employer&auto=1'
      },
      { label: 'Northbridge Benefits Group', username: 'william.schultz' },
      { label: 'E&B internal operations', username: 'ops' }
    ]
  },
  {
    title: 'Shop and Enroll',
    users: [
      {
        label: 'Shop and Enroll Individual',
        username: 'chris',
        href: '/login?user=chris&redirect=/individual'
      },
      {
        label: 'Shop and Enroll Individual demo',
        username: 'chris',
        href: '/login?user=chris&redirect=/individual'
      }
    ]
  }
];

export default async function LoginPage() {
  return (
    <main className="averra-platform-screen">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
          <section className="averra-platform-card overflow-hidden">
            <div className="relative px-10 py-12 sm:px-12 sm:py-16">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,79,163,0.18),transparent_24%),radial-gradient(circle_at_85%_0%,rgba(76,159,204,0.16),transparent_26%)]" aria-hidden="true" />
              <div className="absolute -right-14 top-8 h-36 w-36 rounded-full bg-[rgba(216,79,163,0.24)] blur-xl" aria-hidden="true" />
              <div className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-[rgba(76,159,204,0.22)] blur-lg" aria-hidden="true" />

              <div className="relative max-w-2xl">
                <div className="averra-platform-pill px-4 py-2">
                  <span className="averra-platform-logo averra-platform-logo--pill" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static platform branding asset is served from local public storage */}
                    <img src="/branding/averra_logo_cutout.svg" alt="" />
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-white">
                    Averra Portal
                  </span>
                </div>

                <div className="averra-platform-lockup mt-8">
                  <span className="averra-platform-logo averra-platform-logo--hero" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static platform branding asset is served from local public storage */}
                    <img src="/branding/averra_logo_cutout.svg" alt="" />
                  </span>
                  <div>
                    <p className="averra-platform-kicker text-xs font-semibold text-[var(--averra-platform-muted)]">
                      Averra Access
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Unified platform sign-in
                    </p>
                  </div>
                </div>

                <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl">
                  Secure access to the <span className="averra-platform-wordmark">Averra</span> platform
                </h1>
                <p className="averra-platform-text-muted mt-5 max-w-xl text-base leading-7">
                  Sign in to open member, provider, employer, broker, and admin access paths from one protected platform gateway.
                </p>

                <section className="mt-8 rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.05)] p-5" aria-label="Quick sign-in users">
                  <h2 className="text-sm font-semibold text-white">Quick sign-in users</h2>
                  <div className="mt-3 space-y-3">
                    {quickSignInGroups.map((group) => (
                      <div key={group.title}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--averra-platform-muted)]">
                          {group.title}
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {group.users.map((user) => (
                            <a
                              key={`${group.title}-${user.label}-${user.username}`}
                              href={user.href ?? `/login?user=${encodeURIComponent(user.username)}`}
                              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-xs transition hover:border-[var(--averra-blue)]"
                            >
                              <span className="truncate text-[var(--averra-platform-muted)]">{user.label}</span>
                              <span className="font-semibold text-white">{user.username}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-4 lg:items-end">
            <LoginForm helperText="Use your username/email. Employers can also use Employer Key, for example `EMP-0316043829906172-001` or `EMP-0316043829906172-002`." />
          </div>
        </div>
      </section>
    </main>
  );
}
