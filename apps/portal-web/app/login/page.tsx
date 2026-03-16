import { LoginForm } from './login-form';

const quickSignInGroups = [
  {
    title: 'Member',
    users: [
      { label: 'Portal member', username: 'maria' },
      { label: 'Real Health SQL member', username: 'm0000002' },
      { label: 'Real Health demo member', username: 'realmember' }
    ]
  },
  {
    title: 'Admin',
    users: [
      { label: 'Tenant admin', username: 'tenant' },
      { label: 'Real Health tenant admin', username: 'realtenantadmin' },
      { label: 'Platform admin', username: 'admin' }
    ]
  },
  {
    title: 'Other',
    users: [
      { label: 'Provider user', username: 'Provider1' },
      { label: 'E&B employer admin', username: 'blue-horizon-health' },
      { label: 'E&B broker', username: 'broker' },
      { label: 'E&B internal operations', username: 'ops' }
    ]
  }
] as const;

export default async function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
          <section className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-white shadow-sm">
            <div className="relative px-10 py-12 sm:px-12 sm:py-16">
              <div
                className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary-soft-color)] via-white to-white"
                aria-hidden="true"
              />
              <div className="absolute -right-14 top-8 h-36 w-36 rounded-full bg-[var(--tenant-primary-soft-color)]/70 blur-xl" aria-hidden="true" />
              <div className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-sky-100/80 blur-lg" aria-hidden="true" />

              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-white/90 px-4 py-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] text-xs font-bold text-white">
                    P
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
                    Payer Portal
                  </span>
                </div>

                <h1 className="mt-8 text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
                  Secure access to your health plan portal
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                  Sign in to review coverage, claims, ID cards, and support options in a protected healthcare environment.
                </p>

                <section className="mt-8 rounded-2xl border border-[var(--border-subtle)] bg-white/90 p-5" aria-label="Quick sign-in users">
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Quick sign-in users</h2>
                  <div className="mt-3 space-y-3">
                    {quickSignInGroups.map((group) => (
                      <div key={group.title}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          {group.title}
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {group.users.map((user) => (
                            <a
                              key={user.username}
                              href={`/login?user=${encodeURIComponent(user.username)}`}
                              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs transition hover:border-[var(--tenant-primary-color)]"
                            >
                              <span className="truncate text-[var(--text-secondary)]">{user.label}</span>
                              <span className="font-semibold text-[var(--text-primary)]">{user.username}</span>
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
            <LoginForm helperText="Use your username/email. Employers can also use Employer Key (tenant slug), for example `blue-horizon-health`." />
          </div>
        </div>
      </section>
    </main>
  );
}
