'use client';

import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useAdminSession } from '../../components/admin-session-provider';
import { clearAdminSession, storeAdminSession } from '../../lib/api-auth';

const portalBaseUrl =
  process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'http://localhost:3000';
const PORTAL_TOKEN_COOKIE = 'portal-token';
const PORTAL_USER_COOKIE = 'portal-user';

function isAdminUser(roles: string[]) {
  return (
    roles.includes('tenant_admin') ||
    roles.includes('platform_admin') ||
    roles.includes('platform-admin')
  );
}

function redirectToMemberPortal(payload: {
  token: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    tenant?: {
      id: string;
      name: string;
      brandingConfig?: Record<string, unknown>;
    };
    roles: string[];
    permissions: string[];
  };
}) {
  const serializedUser = JSON.stringify(payload.user);
  const maxAge = 60 * 60 * 8;

  clearAdminSession();
  localStorage.setItem('portal-token', payload.token);
  localStorage.setItem('portal-user', serializedUser);
  document.cookie = `${PORTAL_TOKEN_COOKIE}=${payload.token}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${PORTAL_USER_COOKIE}=${encodeURIComponent(serializedUser)}; path=/; max-age=${maxAge}; samesite=lax`;
  window.location.assign(`${portalBaseUrl}/dashboard`);
}

export function AdminLoginForm() {
  const searchParams = useSearchParams();
  const { applySession, refreshSession } = useAdminSession();
  const handledHandoffRef = useRef<string | null>(null);
  const [email, setEmail] = useState('tenant');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const adminUserId = searchParams.get('admin_user_id');
    const adminEmail = searchParams.get('admin_email');
    const redirectPath = searchParams.get('redirect') || '/admin';
    const handoffKey = `${adminUserId ?? ''}:${adminEmail ?? ''}:${redirectPath}`;

    if (!adminUserId || !adminEmail) {
      return;
    }

    if (handledHandoffRef.current === handoffKey) {
      return;
    }

    handledHandoffRef.current = handoffKey;

    const isPlatformAdmin =
      redirectPath.startsWith('/platform-admin') ||
      redirectPath.startsWith('/platform') ||
      redirectPath.startsWith('/admin/platform');
    const isTenantAdmin =
      isPlatformAdmin ||
      redirectPath.startsWith('/tenant-admin') ||
      redirectPath.startsWith('/admin/tenant');

    void (async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: adminEmail,
            password: 'demo'
          })
        });

        if (response.ok) {
          const payload = (await response.json()) as {
            token?: string;
            user?: {
              id: string;
              email: string;
              roles: string[];
              permissions: string[];
            };
          };

          if (payload.token && payload.user) {
            storeAdminSession(
              {
                id: payload.user.id,
                email: payload.user.email
              },
              payload.token
            );

            applySession({
              id: payload.user.id,
              email: payload.user.email,
              tenantId: '',
              roles: payload.user.roles,
              permissions: payload.user.permissions,
              isPlatformAdmin:
                payload.user.roles.includes('platform_admin') ||
                payload.user.roles.includes('platform-admin'),
              isTenantAdmin:
                payload.user.roles.includes('tenant_admin') ||
                payload.user.roles.includes('platform_admin') ||
                payload.user.roles.includes('platform-admin')
            });
          }
        } else {
          storeAdminSession({
            id: adminUserId,
            email: adminEmail
          });

          applySession({
            id: adminUserId,
            email: adminEmail,
            tenantId: '',
            roles: isPlatformAdmin
              ? ['platform_admin']
              : isTenantAdmin
                ? ['tenant_admin']
                : [],
            permissions: [],
            isPlatformAdmin,
            isTenantAdmin
          });
        }
      } finally {
        window.location.replace(redirectPath);
        void refreshSession().catch(() => undefined);
      }
    })();
  }, [applySession, refreshSession, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to sign in to admin console.');
        return;
      }

      const payload = (await response.json()) as {
        token: string;
        user: {
          id: string;
          firstName?: string;
          lastName?: string;
          email: string;
          tenant?: {
            id: string;
            name: string;
            brandingConfig?: Record<string, unknown>;
          };
          roles: string[];
          permissions: string[];
        };
      };

      if (!isAdminUser(payload.user.roles)) {
        redirectToMemberPortal(payload);
        return;
      }

      storeAdminSession(payload.user, payload.token);
      applySession({
        id: payload.user.id,
        email: payload.user.email,
        tenantId: '',
        roles: payload.user.roles,
        permissions: payload.user.permissions,
        isPlatformAdmin:
          payload.user.roles.includes('platform_admin') ||
          payload.user.roles.includes('platform-admin'),
        isTenantAdmin:
          payload.user.roles.includes('tenant_admin') ||
          payload.user.roles.includes('platform_admin') ||
          payload.user.roles.includes('platform-admin')
      });

      const destination =
        payload.user.roles.includes('platform_admin') ||
        payload.user.roles.includes('platform-admin')
          ? '/admin/platform/health'
          : payload.user.roles.includes('tenant_admin')
            ? '/admin/tenant/health'
            : '/admin';

      window.location.assign(destination);
    } catch {
      setError('API unavailable. Start the local API and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-admin-border bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
        Sign In
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-admin-text">
        Local admin login
      </h2>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-admin-text">
            Username or email
          </span>
          <input
            className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tenant"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-admin-text">Password</span>
          <input
            className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Any password"
            required
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
