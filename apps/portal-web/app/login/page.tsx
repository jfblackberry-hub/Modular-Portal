import { cookies } from 'next/headers';

import { DemoGate } from '../../components/demo-gate';
import { PlatformBrandingStylesheet } from '../../components/platform-branding-stylesheet';
import { DEMO_ACCESS_COOKIE, findDemoUser } from '../../lib/demo-access';
import { AutoLoginPicker } from './auto-login-picker';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const demoAccessCookie = cookieStore.get(DEMO_ACCESS_COOKIE)?.value ?? '';
  const hasDemoAccess = Boolean(findDemoUser(demoAccessCookie));

  if (!hasDemoAccess) {
    return <DemoGate />;
  }

  return (
    <>
      <PlatformBrandingStylesheet />
      <main className="averra-platform-screen">
        <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.88fr)]">
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
                      averra access
                    </span>
                  </div>

                  <div className="averra-platform-lockup mt-8">
                    <span className="averra-platform-logo averra-platform-logo--hero" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element -- static platform branding asset is served from local public storage */}
                      <img src="/branding/averra_logo_cutout.svg" alt="" />
                    </span>
                    <div>
                      <p className="averra-platform-kicker text-xs font-semibold text-[var(--averra-platform-muted)]">
                        averra access
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        Standardized workspace sign-in
                      </p>
                    </div>
                  </div>

                  <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl">
                    Open the right <span className="averra-platform-wordmark">averra</span> workspace from one login surface
                  </h1>
                  <p className="averra-platform-text-muted mt-5 max-w-xl text-base leading-7">
                    Use one standardized sign-in flow for admin, payer, and clinic access. Companies, personas, and active users are loaded directly from the live platform database.
                  </p>

                  <section className="mt-8 rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.05)] p-5">
                    <h2 className="text-sm font-semibold text-white">How it works</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--averra-platform-muted)]">
                          Step 1
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">Choose tenant type</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--averra-platform-muted)]">
                          Start with Admin, Payer, or Clinic.
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--averra-platform-muted)]">
                          Step 2
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">Pick company and persona</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--averra-platform-muted)]">
                          Narrow the login path to the exact audience you need.
                        </p>
                      </div>
                      <div className="rounded-xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--averra-platform-muted)]">
                          Step 3
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">Open an active user</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--averra-platform-muted)]">
                          The user list stays current as real users are added.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </section>

            <div className="flex flex-col items-center gap-4 lg:items-end">
              <AutoLoginPicker />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
