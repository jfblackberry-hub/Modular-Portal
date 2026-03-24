'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';

const demoAccounts = [
  { label: 'Anorth', username: 'Anorth' },
  { label: 'Cgallagher', username: 'Cgallagher' },
  { label: 'Mshuster', username: 'Mshuster' },
  { label: 'Jfrank', username: 'Jfrank' }
];

export function DemoGate() {
  const router = useRouter();
  const [username, setUsername] = useState(demoAccounts[0]?.username ?? '');
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
    <main className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]">
          <section className="overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-white shadow-sm">
            <div className="relative px-10 py-12 sm:px-12 sm:py-16">
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,108,189,0.16),_transparent_45%),linear-gradient(135deg,rgba(255,255,255,1),rgba(240,247,255,0.92))]"
                aria-hidden="true"
              />
              <div className="absolute -right-12 top-6 h-32 w-32 rounded-full bg-sky-100/80 blur-2xl" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[var(--tenant-primary-soft-color)] blur-2xl" aria-hidden="true" />

              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-white/95 px-4 py-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] text-xs font-bold text-white">
                    D
                  </span>
                  <span className="text-sm font-semibold tracking-[0.08em] text-[var(--text-primary)]">
                    Modular Portal Pilot Demo Access
                  </span>
                </div>

                <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl">
                  Controlled entry for the demo environment
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                  This front-door screen keeps the pilot materials behind a lightweight
                  demo gate before the portal’s auto-login shortcuts are exposed.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => {
                        setUsername(account.username);
                        setPassword('');
                      }}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-white/95 p-4 text-left transition hover:border-[var(--tenant-primary-color)] hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {account.label}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Approved demo user
                      </p>
                      <p className="mt-3 text-sm text-[var(--text-secondary)]">
                        Username: <span className="font-semibold text-[var(--text-primary)]">{account.username}</span>
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--border-subtle)] bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--tenant-primary-color)]">
              Demo Sign-In
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">
              Enter the pilot portal
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Use your assigned demo credentials to unlock the pilot environment.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-sm outline-none transition focus:border-[var(--tenant-primary-color)]"
                  autoComplete="username"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-sm outline-none transition focus:border-[var(--tenant-primary-color)]"
                  autoComplete="current-password"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
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
