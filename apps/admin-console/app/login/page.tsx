'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { AdminLoginForm } from './admin-login-form';

const portalBaseUrl =
  process.env.NEXT_PUBLIC_PORTAL_BASE_URL ?? 'http://localhost:3000';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const returnToPortal = searchParams.get('returnToPortal') === '1';

  useEffect(() => {
    if (!returnToPortal) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.assign(`${portalBaseUrl}/login`);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (returnToPortal) {
    return (
      <main className="min-h-screen bg-admin-bg px-6 py-12 text-admin-text">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <section className="w-full rounded-3xl border border-admin-border bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
              Returning To Portal
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-admin-text">
              Taking you to the main portal login.
            </h1>
            <p className="mt-4 text-base text-admin-muted">
              If you are not redirected automatically, use the link below.
            </p>
            <div className="mt-8">
              <Link
                href={`${portalBaseUrl}/login`}
                className="inline-flex rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Go to portal login
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-admin-bg px-6 py-12 text-admin-text">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center justify-center">
        <div className="w-full space-y-5">
          <AdminLoginForm />
          <div className="text-center text-sm text-admin-muted">
            Need member access instead?{' '}
            <Link href={`${portalBaseUrl}/login`} className="font-semibold text-admin-accent hover:underline">
              Go to portal login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
