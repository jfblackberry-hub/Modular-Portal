'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';

export function DemoGate() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/demo-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        setError('Demo access denied. Check the assigned username and password.');
        return;
      }

      router.refresh();
    } catch {
      setError('Demo access is temporarily unavailable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="averra-platform-screen">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]">
          <section className="averra-platform-card overflow-hidden">
            <div className="relative px-10 py-12 sm:px-12 sm:py-16">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,79,163,0.18),transparent_24%),radial-gradient(circle_at_85%_0%,rgba(76,159,204,0.16),transparent_26%)]"
                aria-hidden="true"
              />
              <div className="absolute -right-12 top-6 h-32 w-32 rounded-full bg-[rgba(216,79,163,0.24)] blur-2xl" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[rgba(76,159,204,0.2)] blur-2xl" aria-hidden="true" />

              <div className="relative max-w-2xl">
                <div className="averra-platform-pill px-4 py-2">
                  <span className="averra-platform-logo averra-platform-logo--pill" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static platform branding asset is served from local public storage */}
                    <img src="/branding/averra_logo_cutout.svg" alt="" />
                  </span>
                  <span className="text-sm font-semibold tracking-[0.08em] text-white">
                    Averra Demo Access
                  </span>
                </div>

                <div className="averra-platform-lockup mt-8">
                  <span className="averra-platform-logo averra-platform-logo--hero" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static platform branding asset is served from local public storage */}
                    <img src="/branding/averra_logo_cutout.svg" alt="" />
                  </span>
                  <div>
                    <p className="averra-platform-kicker text-xs font-semibold text-[var(--averra-platform-muted)]">
                      Approved Users
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Demo environment access
                    </p>
                  </div>
                </div>

                <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl">
                  Controlled entry for the <span className="averra-platform-wordmark">Averra</span> demo environment
                </h1>
                <p className="averra-platform-text-muted mt-5 max-w-2xl text-base leading-7">
                  This front-door screen keeps the pilot materials behind a lightweight
                  brand-controlled gate before the portal’s auto-login shortcuts are exposed.
                </p>

                <div className="mt-8 rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.05)] p-5">
                  <p className="text-sm font-semibold text-white">
                    Access is granted by assigned credentials only.
                  </p>
                  <p className="averra-platform-text-muted mt-2 text-sm leading-6">
                    Enter the username and password issued for your demo session. Approved user names are no longer listed on this screen.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="averra-platform-card p-8 sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--averra-blue)]">
              Demo Sign-In
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">
              Enter the Averra pilot portal
            </h2>
            <p className="averra-platform-text-muted mt-3 text-sm leading-6">
              Use your assigned demo credentials to unlock the pilot environment.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-semibold text-white">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--averra-blue)]"
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-white">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--averra-border)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--averra-blue)]"
                  autoComplete="current-password"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-[rgba(251,113,133,0.34)] bg-[rgba(127,29,29,0.22)] px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="averra-platform-button averra-platform-button--primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Checking access...' : 'Unlock Demo'}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
