'use client';

import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { buildAdminHandoffUrl } from '../../lib/admin-redirect';

export function LoginForm({
  defaultUsername = '',
  loginPath = '/api/auth/login',
  successPath = '/dashboard',
  helperText = ''
}: {
  defaultUsername?: string;
  loginPath?: string;
  successPath?: string;
  helperText?: string;
}) {
  const searchParams = useSearchParams();
  const selectedUser = searchParams.get('user')?.trim();
  const [email, setEmail] = useState(defaultUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [authPhase, setAuthPhase] = useState<'idle' | 'authenticating' | 'finalizing'>('idle');
  const submitLockRef = useRef(false);

  useEffect(() => {
    void clearAuthStorage();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setEmail(selectedUser);
    }
  }, [selectedUser]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current) {
      console.info('[portal-auth] submit ignored (already authenticating)');
      return;
    }

    submitLockRef.current = true;
    setError('');
    setAuthPhase('authenticating');
    console.info('[portal-auth] submit click', { loginPath, email, rememberMe });
    let navigating = false;

    try {
      await clearAuthStorage();
      const resolvedPassword = password.trim() || 'demo';
      console.info('[portal-auth] auth request start', { loginPath });
      const response = await fetch(loginPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password: resolvedPassword, rememberMe })
      });
      console.info('[portal-auth] auth request end', {
        loginPath,
        ok: response.ok,
        status: response.status
      });

      if (!response.ok) {
        setError('Unable to sign in. Check your credentials and try again.');
        return;
      }

      const payload = (await response.json()) as {
        sessionEstablished?: boolean;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          landingContext?:
            | 'member'
            | 'provider'
            | 'employer'
            | 'tenant_admin'
            | 'platform_admin';
          tenant: {
            id: string;
            name: string;
            brandingConfig?: Record<string, unknown>;
          };
          roles: string[];
          permissions: string[];
        };
      };

      console.info('[portal-auth] token write', {
        sessionEstablished: payload.sessionEstablished === true
      });

      if (payload.sessionEstablished !== true) {
        setError('Sign-in state could not be established. Please try again.');
        return;
      }

      setAuthPhase('finalizing');
      console.info('[portal-auth] auth state change', { state: 'authenticated' });
      const adminRedirectUrl = buildAdminHandoffUrl(payload.user);

      if (adminRedirectUrl) {
        console.info('[portal-auth] redirect/navigation', { to: adminRedirectUrl });
        navigating = true;
        window.location.assign(adminRedirectUrl);
        return;
      }

      if (payload.user.landingContext === 'provider') {
        console.info('[portal-auth] redirect/navigation', { to: '/provider/dashboard' });
        navigating = true;
        window.location.assign('/provider/dashboard');
        return;
      }

      if (payload.user.landingContext === 'employer') {
        console.info('[portal-auth] redirect/navigation', { to: '/dashboard/billing-enrollment' });
        navigating = true;
        window.location.assign('/dashboard/billing-enrollment');
        return;
      }

      const ebRoleSet = new Set([
        'employer_group_admin',
        'broker',
        'internal_operations',
        'internal_admin'
      ]);

      if (payload.user.roles.some((role) => ebRoleSet.has(role))) {
        console.info('[portal-auth] redirect/navigation', { to: '/dashboard/billing-enrollment' });
        navigating = true;
        window.location.assign('/dashboard/billing-enrollment');
        return;
      }

      console.info('[portal-auth] redirect/navigation', { to: successPath });
      navigating = true;
      window.location.assign(successPath);
    } catch {
      setError('Sign-in is temporarily unavailable. Please try again.');
    } finally {
      submitLockRef.current = false;
      if (!navigating) {
        setAuthPhase('idle');
      }
    }
  }

  async function clearAuthStorage() {
    localStorage.removeItem('portal-token');
    localStorage.removeItem('portal-user');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store'
      });
    } catch {
      // Ignore cleanup errors and continue login flow.
    }
  }

  return (
    <div className="portal-card w-full max-w-[420px] p-12">
      <div className="space-y-8">
        <div>
        <p className="text-sm font-medium text-[var(--tenant-primary-color)]">
          Sign in
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
          Access your healthcare portal
        </h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Username or email
          </span>
          <input
            className="portal-input mt-2 px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            required
            autoComplete="username"
            aria-label="Username or email"
          />
          {helperText ? (
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">
              {helperText}
            </p>
          ) : null}
          <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            Demo default password is <span className="font-medium">demo</span> if left blank.
          </p>
        </label>

        <label className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Password
            </span>
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="text-sm font-medium text-[var(--tenant-primary-color)]"
            >
              {showPassword ? 'Hide' : 'Show'} password
            </button>
          </div>
          <input
            className="portal-input mt-2 px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password (optional for demo)"
            autoComplete="current-password"
            aria-label="Password"
          />
        </label>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me on this device
          </label>
          <a
            href="#support-links"
            className="text-sm font-medium text-[var(--tenant-primary-color)]"
          >
            Forgot password?
          </a>
        </div>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={authPhase !== 'idle'}
        >
          {authPhase === 'authenticating' ? 'Signing in...' : authPhase === 'finalizing' ? 'Finishing sign in...' : 'Sign In'}
        </button>
      </form>

      <div id="support-links" className="border-t border-[var(--border-subtle)] pt-6">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
          <a href="/dashboard/help">Accessibility</a>
          <a href="/dashboard/help">Privacy</a>
          <a href="/dashboard/help">Language support</a>
          <a href="/dashboard/help">Support contact</a>
        </div>
      </div>
      </div>
    </div>
  );
}
