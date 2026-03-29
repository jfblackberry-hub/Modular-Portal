'use client';

import { useSearchParams } from 'next/navigation';
import type { FormEvent } from 'react';
import { Suspense, useEffect, useRef, useState } from 'react';

import { useAdminSession } from '../../components/admin-session-provider';
import type { AdminSession } from '../../lib/admin-session';
import { clearAdminSession } from '../../lib/api-auth';
import {
  parseSafeAdminPostLoginRedirect,
  sanitizeAdminPostLoginRedirect,
  sanitizeSameOriginRelativeRedirect
} from '../../lib/safe-admin-redirect';

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

  if (!response.ok || !payload) {
    throw new Error(payload?.message ?? 'Portal handoff failed.');
  }

  return sanitizeSameOriginRelativeRedirect(
    payload.redirectPath,
    input.handoffUrl,
    '/dashboard'
  );
}

async function establishAdminHandoffSession(input: {
  artifact: string;
  handoffPath: string;
  redirectPath?: string;
}): Promise<{
  redirectPath?: string;
  session: AdminSession;
}> {
  const response = await fetch(input.handoffPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      artifact: input.artifact,
      redirectPath: input.redirectPath
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        redirectPath?: string;
        session?: AdminSession;
        message?: string;
      }
    | null;

  if (!response.ok || !payload?.session) {
    throw new Error(payload?.message ?? 'Admin session handoff failed.');
  }

  return {
    redirectPath: payload.redirectPath,
    session: payload.session
  };
}

function AdminLoginFormContent() {
  const searchParams = useSearchParams();
  const { applySession } = useAdminSession();
  const submitLockRef = useRef(false);
  const handoffHandledRef = useRef(false);
  const [email, setEmail] = useState('tenant');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const artifact = searchParams.get('artifact')?.trim();
    const redirectPathFromQuery = parseSafeAdminPostLoginRedirect(
      searchParams.get('redirectPath')
    );

    if (!artifact || handoffHandledRef.current) {
      return;
    }

    handoffHandledRef.current = true;
    setError('');
    setIsSubmitting(true);

    void establishAdminHandoffSession({
      artifact,
      handoffPath: '/api/auth/session/handoff',
      redirectPath: redirectPathFromQuery
    })
      .then((handoffPayload) => {
        applySession(handoffPayload.session);
        window.location.assign(
          sanitizeAdminPostLoginRedirect(
            handoffPayload.redirectPath ?? redirectPathFromQuery
          )
        );
      })
      .catch((nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Admin session handoff failed.'
        );
        handoffHandledRef.current = false;
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [applySession, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setError('');
    setIsSubmitting(true);

    try {
      if (!password.trim()) {
        setError('Enter your password to continue.');
        return;
      }

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
        handoffPath?: string;
        redirectPath?: string;
        sessionHandoff?: boolean;
        directSession?: boolean;
        session?: AdminSession;
      };

      if (payload.handoffRequired && payload.artifact && payload.handoffUrl) {
        clearAdminSession();
        const redirectPath = await establishPortalHandoffSession({
          artifact: payload.artifact,
          handoffUrl: payload.handoffUrl
        });
        window.location.assign(
          new URL(redirectPath, payload.handoffUrl).toString()
        );
        return;
      }

      if (payload.directSession && payload.session) {
        applySession(payload.session);
        window.location.assign(
          sanitizeAdminPostLoginRedirect(payload.redirectPath)
        );
        return;
      }

      if (!payload.sessionHandoff || !payload.artifact || !payload.handoffPath) {
        setError('Unable to establish a secure admin session handoff.');
        return;
      }

      const handoffPayload = await establishAdminHandoffSession({
        artifact: payload.artifact,
        handoffPath: payload.handoffPath,
        redirectPath: parseSafeAdminPostLoginRedirect(payload.redirectPath)
      });
      applySession(handoffPayload.session);

      window.location.assign(
        sanitizeAdminPostLoginRedirect(
          handoffPayload.redirectPath ?? payload.redirectPath
        )
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'API unavailable. Start the local API and try again.'
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-form-card p-8">
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
            className="admin-input mt-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tenant"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-admin-text">Password</span>
          <input
            className="admin-input mt-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
          />
        </label>

        {error ? (
          <p className="admin-notice admin-notice--danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="admin-button admin-button--primary w-full disabled:cursor-not-allowed disabled:opacity-70"
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
