import Link from 'next/link';

import { LoginForm } from '../login/login-form';

export default function ProviderLoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-white shadow-sm">
            <div className="portal-shell-gradient relative overflow-hidden px-8 py-10 text-white sm:px-10">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-emerald-300/15 blur-2xl" />
              <p className="text-[13px] font-medium text-sky-100">Welcome to your provider portal</p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Run office operations in one workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-sky-50">
                Verify eligibility, submit prior authorizations, monitor claims and payments, and access support resources.
              </p>
            </div>

            <div className="grid gap-6 px-8 py-8 sm:grid-cols-2 sm:px-10">
              <article className="rounded-2xl bg-[var(--bg-page)] p-5">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Top provider tasks</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                  <li>Check member eligibility and benefits</li>
                  <li>Submit and track prior authorizations</li>
                  <li>Review claim and payment activity</li>
                  <li>Open support and training resources</li>
                </ul>
              </article>

              <article className="rounded-2xl bg-[var(--bg-page)] p-5">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Local provider account</h2>
                <dl className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Provider user</dt>
                    <dd className="font-semibold text-[var(--text-primary)]">Provider1</dd>
                  </div>
                  <div className="pt-2 text-[13px] text-[var(--text-muted)]">Any non-empty password works locally.</div>
                </dl>
              </article>
            </div>
          </div>

          <div className="max-w-xl lg:ml-auto lg:w-full">
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Provider sign in</p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              This sign-in path is dedicated to provider users and routes directly to the provider portal.
            </p>
            <LoginForm
              defaultUsername="Provider1"
              loginPath="/api/auth/login/provider"
              successPath="/provider/dashboard"
              helperText="Use `Provider1` for local provider login."
            />
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Need member sign in instead?{' '}
              <Link href="/login" className="font-semibold text-[var(--tenant-primary-color)] hover:underline">
                Open member login
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
