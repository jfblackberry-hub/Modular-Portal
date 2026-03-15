'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { AdminContentRouter } from './admin-content-router';
import { useAdminSession } from './admin-session-provider';
import { getDefaultAdminHref } from './admin-route-config';
import { LeftAdminMenu } from './left-admin-menu';
import { TopHeader } from './top-header';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading, signOut } = useAdminSession();

  useEffect(() => {
    if (!isLoading && !session && pathname !== '/login') {
      router.replace('/login');
    }
  }, [isLoading, pathname, router, session]);

  useEffect(() => {
    if (!isLoading && session && (pathname === '/' || pathname === '/admin')) {
      router.replace(getDefaultAdminHref(session.isPlatformAdmin));
    }
  }, [isLoading, pathname, router, session]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text">
      <div className="flex min-h-screen">
        <LeftAdminMenu session={session} />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopHeader session={session} signOut={signOut} />
          <AdminContentRouter>{children}</AdminContentRouter>
        </div>
      </div>
    </div>
  );
}
