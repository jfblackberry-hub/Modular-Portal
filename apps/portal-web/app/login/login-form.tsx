'use client';

import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import {
  LEGACY_PORTAL_SESSION_COOKIE,
  LEGACY_PORTAL_TOKEN_COOKIE,
  LEGACY_PORTAL_USER_COOKIE
} from '../../lib/session-constants';

function LoginFormContent({
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
  const requestedRedirect = searchParams.get('redirect')?.trim();
  const autoLogin = searchParams.get('auto') === '1';
  const [email, setEmail] = useState(defaultUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [tenantOptions, setTenantOptions] = useState<
    Array<{ id: string; name: string; tenantTypeCode: string; isDefault: boolean }>
  >([]);
  const [tenantPrompt, setTenantPrompt] = useState('');
  const [organizationUnitId, setOrganizationUnitId] = useState('');
  const [organizationUnitOptions, setOrganizationUnitOptions] = useState<
    Array<{ id: string; name: string; type: string }>
  >([]);
  const [organizationUnitPrompt, setOrganizationUnitPrompt] = useState('');
  const [error, setError] = useState('');
  const [authPhase, setAuthPhase] = useState<'idle' | 'authenticating' | 'finalizing'>('idle');
  const submitLockRef = useRef(false);
  const autoLoginHandledRef = useRef<string | null>(null);

  const confirmSessionEstablished = useCallback(async function confirmSessionEstablished() {
    const attempts = 5;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        const payload = (await response.json()) as { sessionEstablished?: boolean };
        if (payload.sessionEstablished === true) {
          console.info('[portal-auth] auth state change', {
            state: 'session-confirmed',
            attempt
          });
          return true;
        }
      }

      await new Promise((resolve) => {
        setTimeout(resolve, attempt * 120);
      });
    }

    return false;
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setEmail(selectedUser);
    }
  }, [selectedUser]);

  const performLogin = useCallback(async function performLogin(emailOverride?: string) {
    if (submitLockRef.current) {
      console.info('[portal-auth] submit ignored (already authenticating)');
      return;
    }

    const resolvedEmail = emailOverride ?? email;
    submitLockRef.current = true;
    setError('');
    setTenantPrompt('');
    setOrganizationUnitPrompt('');
    setAuthPhase('authenticating');
    console.info('[portal-auth] submit click', { loginPath, email: resolvedEmail, rememberMe });
    let navigating = false;

    try {
      clearLegacyAuthStorage();
      const resolvedPassword = password.trim();
      if (!resolvedPassword) {
        setError('Enter your password to continue.');
        return;
      }
      console.info('[portal-auth] auth request start', { loginPath });
      const response = await fetch(loginPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: resolvedEmail,
          password: resolvedPassword,
          rememberMe,
          ...(tenantId ? { tenantId } : {}),
          ...(organizationUnitId ? { organizationUnitId } : {})
        })
      });
      console.info('[portal-auth] auth request end', {
        loginPath,
        ok: response.ok,
        status: response.status
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
          tenantSelectionRequired?: boolean;
          organizationUnitSelectionRequired?: boolean;
          user?: {
            availableTenants?: Array<{
              id: string;
              name: string;
              tenantTypeCode: string;
              isDefault: boolean;
            }>;
            availableOrganizationUnits?: Array<{
              id: string;
              name: string;
              type: string;
            }>;
            tenant?: {
              name?: string;
            } | null;
          };
        } | null;
        if (
          response.status === 409 &&
          payload?.tenantSelectionRequired === true &&
          payload.user?.availableTenants?.length
        ) {
          setTenantOptions(payload.user.availableTenants);
          setTenantId((current) =>
            current ||
            payload.user?.availableTenants?.find((tenant) => tenant.isDefault)?.id ||
            payload.user?.availableTenants?.[0]?.id ||
            ''
          );
          setTenantPrompt('Select the tenant you want to use for this session.');
          setOrganizationUnitOptions([]);
          setOrganizationUnitId('');
          setOrganizationUnitPrompt('');
          setError('');
          return;
        }
        if (
          response.status === 409 &&
          payload?.organizationUnitSelectionRequired === true &&
          payload.user?.availableOrganizationUnits?.length
        ) {
          setTenantOptions([]);
          setTenantPrompt('');
          setOrganizationUnitOptions(payload.user.availableOrganizationUnits);
          setOrganizationUnitId((current) =>
            current ||
            payload.user?.availableOrganizationUnits?.[0]?.id ||
            ''
          );
          setOrganizationUnitPrompt(
            `Select the Organization Unit you want to use for this session${payload.user?.tenant?.name ? ` in ${payload.user.tenant.name}` : ''}.`
          );
          setError('');
          return;
        }
        setError(payload?.message ?? 'Unable to sign in. Check your credentials and try again.');
        return;
      }

      const payload = (await response.json()) as {
        sessionEstablished?: boolean;
        sessionHandoff?: boolean;
        handoffUrl?: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          session: {
            type: 'tenant_admin' | 'end_user' | 'platform_admin';
            tenantId: string | null;
            roles: string[];
            permissions: string[];
            activeOrganizationUnit: {
              id: string;
              name: string;
              type: string;
            } | null;
            availableOrganizationUnits: Array<{
              id: string;
              name: string;
              type: string;
            }>;
          };
          landingContext?:
            | 'member'
            | 'provider'
            | 'broker'
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

      setTenantOptions([]);
      setTenantPrompt('');
      setOrganizationUnitOptions([]);
      setOrganizationUnitPrompt('');

      console.info('[portal-auth] token write', {
        sessionEstablished: payload.sessionEstablished === true,
        sessionHandoff: payload.sessionHandoff === true
      });

      if (payload.sessionHandoff === true && payload.handoffUrl) {
        console.info('[portal-auth] redirect/navigation', { to: payload.handoffUrl });
        navigating = true;
        window.location.assign(payload.handoffUrl);
        return;
      }

      if (payload.sessionEstablished !== true) {
        setError('Sign-in state could not be established. Please try again.');
        return;
      }

      setAuthPhase('finalizing');
      const sessionConfirmed = await confirmSessionEstablished();
      if (!sessionConfirmed) {
        setError('Sign-in state is still initializing. Please try again.');
        return;
      }

      console.info('[portal-auth] auth state change', { state: 'authenticated' });
      const redirectPath =
        requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
          ? requestedRedirect
          : successPath;

      if (requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')) {
        console.info('[portal-auth] redirect/navigation', { to: requestedRedirect });
        navigating = true;
        window.location.assign(requestedRedirect);
        return;
      }

      if (
        payload.user.session.type === 'platform_admin' ||
        payload.user.session.type === 'tenant_admin'
      ) {
        setError('Admin sign-in handoff did not complete. Please try again.');
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

      console.info('[portal-auth] redirect/navigation', { to: redirectPath });
      navigating = true;
      window.location.assign(redirectPath);
    } catch {
      setError('Sign-in is temporarily unavailable. Please try again.');
    } finally {
      submitLockRef.current = false;
      if (!navigating) {
        setAuthPhase('idle');
      }
    }
  }, [
    confirmSessionEstablished,
    email,
    loginPath,
    password,
    rememberMe,
    requestedRedirect,
    successPath,
    tenantId,
    organizationUnitId
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await performLogin();
  }

  useEffect(() => {
    if (!autoLogin || !selectedUser) {
      return;
    }

    const autoLoginKey = `${loginPath}:${selectedUser}:${requestedRedirect ?? ''}`;
    if (autoLoginHandledRef.current === autoLoginKey) {
      return;
    }

    autoLoginHandledRef.current = autoLoginKey;
    void performLogin(selectedUser);
  }, [autoLogin, loginPath, performLogin, requestedRedirect, selectedUser]);

  function clearLegacyAuthStorage() {
    localStorage.removeItem(LEGACY_PORTAL_TOKEN_COOKIE);
    localStorage.removeItem(LEGACY_PORTAL_USER_COOKIE);
    document.cookie = `${LEGACY_PORTAL_SESSION_COOKIE}=; Max-Age=0; path=/`;
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
            onChange={(event) => {
              setEmail(event.target.value);
              setTenantOptions([]);
              setTenantId('');
              setTenantPrompt('');
              setOrganizationUnitOptions([]);
              setOrganizationUnitId('');
              setOrganizationUnitPrompt('');
            }}
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

        {tenantOptions.length > 0 ? (
          <label className="block">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Tenant
            </span>
            <select
              className="portal-input mt-2 w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
              value={tenantId}
              onChange={(event) => {
                setTenantId(event.target.value);
                setOrganizationUnitOptions([]);
                setOrganizationUnitId('');
                setOrganizationUnitPrompt('');
              }}
              required
              aria-label="Tenant"
            >
              {tenantOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.tenantTypeCode.toLowerCase()})
                </option>
              ))}
            </select>
            {tenantPrompt ? (
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                {tenantPrompt}
              </p>
            ) : null}
          </label>
        ) : null}

        {organizationUnitOptions.length > 0 ? (
          <label className="block">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Organization Unit
            </span>
            <select
              className="portal-input mt-2 w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
              value={organizationUnitId}
              onChange={(event) => setOrganizationUnitId(event.target.value)}
              required
              aria-label="Organization Unit"
            >
              {organizationUnitOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.type.toLowerCase()})
                </option>
              ))}
            </select>
            {organizationUnitPrompt ? (
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">
                {organizationUnitPrompt}
              </p>
            ) : null}
          </label>
        ) : null}

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
          {authPhase === 'authenticating'
            ? 'Signing in...'
            : authPhase === 'finalizing'
              ? 'Finishing sign in...'
              : tenantOptions.length > 0
                ? 'Continue with Tenant'
              : organizationUnitOptions.length > 0
                ? 'Continue with Organization Unit'
                : 'Sign In'}
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

export function LoginForm(props: {
  defaultUsername?: string;
  loginPath?: string;
  successPath?: string;
  helperText?: string;
}) {
  return (
    <Suspense fallback={<div className="min-h-[24rem]" aria-hidden="true" />}>
      <LoginFormContent {...props} />
    </Suspense>
  );
}
