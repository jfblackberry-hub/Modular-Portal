'use client';

import type { FormEvent } from 'react';
import { Suspense, useRef, useState } from 'react';

import { useAdminSession } from '../../components/admin-session-provider';
import { clearAdminSession, storeAdminSession } from '../../lib/api-auth';

function isAdminUser(roles: string[]) {
  return (
    roles.includes('tenant_admin') ||
    roles.includes('platform_admin') ||
    roles.includes('platform-admin')
  );
}

async function establishPortalHandoffSession(input: {
  artifact: string;
  handoffUrl: string;
}) {
  const response = await fetch(input.handoffUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      artifact: input.artifact
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        redirectPath?: string;
        message?: string;
      }
    | null;

  if (!response.ok || !payload?.redirectPath) {
    throw new Error(payload?.message ?? 'Portal handoff failed.');
  }

  return payload.redirectPath;
}

function AdminLoginFormContent() {
  const { applySession } = useAdminSession();
  const submitLockRef = useRef(false);
  const [email, setEmail] = useState('tenant');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
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
        handoffRequired?: boolean;
        artifact?: string;
        handoffUrl?: string;
        token?: string;
        user?: {
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

      if (payload.handoffRequired && payload.artifact && payload.handoffUrl) {
        clearAdminSession();
        const redirectPath = await establishPortalHandoffSession({
          artifact: payload.artifact,
          handoffUrl: payload.handoffUrl
        });
        window.location.assign(new URL(redirectPath, payload.handoffUrl).toString());
        return;
      }

      if (!payload.token || !payload.user || !isAdminUser(payload.user.roles)) {
        setError('Unable to establish a secure portal session handoff.');
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
      submitLockRef.current = false;
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

export function AdminLoginForm() {
  return (
    <Suspense fallback={<div className="min-h-[20rem]" aria-hidden="true" />}>
      <AdminLoginFormContent />
    </Suspense>
  );
}
