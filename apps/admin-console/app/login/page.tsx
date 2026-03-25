'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { isReturnToPortalRequest } from '../../lib/admin-login-query';
import { config } from '../../lib/public-runtime';
import { AdminLoginForm } from './admin-login-form';

export const dynamic = 'force-dynamic';

function AdminLoginPageContent() {
  const searchParams = useSearchParams();
  const returnToPortal = isReturnToPortalRequest(searchParams);

  useEffect(() => {
    if (!returnToPortal) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      window.location.assign(`${config.serviceEndpoints.portal}/login`);
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [returnToPortal]);

  if (returnToPortal) {
    return (
      <main className="min-h-screen bg-admin-bg px-6 py-12 text-admin-text">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <section className="admin-form-card w-full p-10 text-center">
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
                href={`${config.serviceEndpoints.portal}/login`}
                className="admin-button admin-button--primary"
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
            <Link href={`${config.serviceEndpoints.portal}/login`} className="font-semibold text-admin-accent hover:underline">
              Go to portal login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-admin-bg px-6 py-12 text-admin-text" />}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
