import { LoginForm } from '../login/login-form';

export default function ProviderLoginPage() {
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
              <div
                className="absolute -right-14 top-8 h-36 w-36 rounded-full bg-[var(--tenant-primary-soft-color)]/70 blur-xl"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-sky-100/80 blur-lg"
                aria-hidden="true"
              />

              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-white/90 px-4 py-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] text-xs font-bold text-white">
                    P
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
                    Provider Portal
                  </span>
                </div>

                <h1 className="mt-8 text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
                  Secure access for provider teams
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                  Sign in to manage eligibility, claims, authorizations, payments, and secure provider communications.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col items-center gap-4 lg:items-end">
            <LoginForm
              defaultUsername="Provider1"
              loginPath="/api/auth/login/provider"
              successPath="/provider/dashboard"
              helperText="Use your provider username or email. The local demo provider user is `Provider1`."
            />
          </div>
        </div>
      </section>
    </main>
  );
}
