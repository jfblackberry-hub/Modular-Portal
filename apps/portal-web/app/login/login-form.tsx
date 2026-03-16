'use client';

import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { buildAdminHandoffUrl } from '../../lib/admin-redirect';
import {
  PORTAL_TOKEN_COOKIE,
  PORTAL_USER_COOKIE
} from '../../lib/session-constants';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.removeItem('portal-token');
    localStorage.removeItem('portal-user');
    document.cookie = `${PORTAL_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${PORTAL_USER_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setEmail(selectedUser);
    }
  }, [selectedUser]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(loginPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        setError('Unable to sign in. Check your credentials and try again.');
        return;
      }

      const payload = (await response.json()) as {
        token: string;
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

      localStorage.setItem('portal-token', payload.token);
      localStorage.setItem('portal-user', JSON.stringify(payload.user));
      const maxAge = rememberMe ? 60 * 60 * 8 : 60 * 60;
      document.cookie = `${PORTAL_TOKEN_COOKIE}=${payload.token}; path=/; max-age=${maxAge}; samesite=lax`;
      document.cookie = `${PORTAL_USER_COOKIE}=${encodeURIComponent(JSON.stringify(payload.user))}; path=/; max-age=${maxAge}; samesite=lax`;
      const adminRedirectUrl = buildAdminHandoffUrl(payload.user);

      if (adminRedirectUrl) {
        window.location.assign(adminRedirectUrl);
        return;
      }

      if (payload.user.landingContext === 'provider') {
        window.location.assign('/provider/dashboard');
        return;
      }

      if (payload.user.landingContext === 'employer') {
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
        window.location.assign('/dashboard/billing-enrollment');
        return;
      }

      window.location.assign(successPath);
    } catch {
      setError('Sign-in is temporarily unavailable. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            placeholder="Enter password"
            required
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
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
