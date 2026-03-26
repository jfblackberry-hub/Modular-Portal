import { PlatformBrandingStylesheet } from '../../components/platform-branding-stylesheet';
import { LoginForm } from '../login/login-form';

const employerQuickSignIns = [
  {
    label: 'Northstar employer',
    username: 'EMP-0316043829906172-001',
    href: '/employer-login?user=EMP-0316043829906172-001&redirect=/employer&auto=1'
  },
  {
    label: 'Lakeside employer',
    username: 'EMP-0316043829906172-002',
    href: '/employer-login?user=EMP-0316043829906172-002&redirect=/employer&auto=1'
  }
];

export default function EmployerLoginPage() {
  return (
    <>
      <PlatformBrandingStylesheet />
      <main className="averra-platform-screen">
        <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
            <section className="averra-platform-card overflow-hidden">
            <div className="relative px-10 py-12 sm:px-12 sm:py-16">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,79,163,0.18),transparent_24%),radial-gradient(circle_at_85%_0%,rgba(76,159,204,0.16),transparent_26%)]"
                aria-hidden="true"
              />
              <div
                className="absolute -right-14 top-8 h-36 w-36 rounded-full bg-[rgba(216,79,163,0.24)] blur-xl"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-[rgba(76,159,204,0.22)] blur-lg"
                aria-hidden="true"
              />

              <div className="relative max-w-2xl">
                <div className="averra-platform-pill px-4 py-2">
                  <span className="averra-platform-logo averra-platform-logo--pill" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static platform branding asset is served from local public storage */}
                    <img src="/branding/averra_logo_cutout.svg" alt="" />
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-white">
                    averra employer access
                  </span>
                </div>

                <h1 className="mt-8 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Secure access for employer teams
                </h1>
                <p className="averra-platform-text-muted mt-5 max-w-xl text-base leading-7">
                  Sign in to manage billing, enrollment, notices, census imports, and employer administration workflows.
                </p>

                <section className="mt-8 rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.05)] p-5" aria-label="Employer quick sign-in options">
                  <h2 className="text-sm font-semibold text-white">Employer quick sign-in options</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {employerQuickSignIns.map((option) => (
                      <a
                        key={option.username}
                        href={option.href}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm transition hover:border-[var(--averra-blue)]"
                      >
                        <span className="truncate text-[var(--averra-platform-muted)]">{option.label}</span>
                        <span className="font-semibold text-white">{option.username}</span>
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-4 lg:items-end">
            <LoginForm
              defaultUsername="EMP-0316043829906172-001"
              loginPath="/api/auth/login/employer"
              successPath="/dashboard/billing-enrollment"
              helperText="Use your employer key or employer login. Demo examples include `EMP-0316043829906172-001` and `EMP-0316043829906172-002`."
            />
          </div>
          </div>
        </section>
      </main>
    </>
  );
}
