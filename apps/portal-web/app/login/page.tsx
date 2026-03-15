import { LoginForm } from './login-form';

export default async function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-white shadow-sm">
            <div className="portal-shell-gradient relative overflow-hidden px-8 py-10 text-white sm:px-10">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-emerald-300/15 blur-2xl" />
              <p className="text-[13px] font-medium text-sky-100">
                Welcome to your member portal
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Manage your plan in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-sky-50">
                Review benefits, view claims, access your ID card, and connect
                with support through a single secure healthcare experience.
              </p>
            </div>

            <div className="grid gap-6 px-8 py-8 sm:grid-cols-2 sm:px-10">
              <article className="rounded-2xl bg-[var(--bg-page)] p-5">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Top member tasks
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                  <li>View your digital ID card</li>
                  <li>Check recent claims and EOBs</li>
                  <li>Search providers and care options</li>
                  <li>Send secure messages to support</li>
                </ul>
              </article>

              <article className="rounded-2xl bg-[var(--bg-page)] p-5">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Local development accounts
                </h2>
                <dl className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Portal member</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">maria</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Provider user</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">Provider1</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>E&amp;B member</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">maria</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>E&amp;B employer group admin</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">employer</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>E&amp;B broker</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">broker</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>E&amp;B internal operations</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">ops</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Tenant admin</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">tenant</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Platform admin</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">admin</dd>
                  </div>
                  <div className="pt-2 text-[13px] text-[var(--text-muted)]">
                    Any non-empty password works locally.
                  </div>
                  <div className="pt-2 text-[13px] text-[var(--text-muted)]">
                    Provider users can sign in here or at `/provider-login`.
                  </div>
                  <div className="pt-2 text-[13px] text-[var(--text-muted)]">
                    E&amp;B role users (`employer`, `broker`, `ops`) land directly in Billing &amp; Enrollment.
                  </div>
                </dl>
              </article>
            </div>
          </div>

          <div className="max-w-xl lg:ml-auto lg:w-full">
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">
              Secure sign in
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Accessibility, privacy, and support links are available below the
              form to match a production-ready payer portal pattern.
            </p>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
