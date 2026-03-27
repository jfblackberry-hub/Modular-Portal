'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { AdminContentRouter } from './admin-content-router';
import { getDefaultAdminHref } from './admin-route-config';
import { useAdminSession } from './admin-session-provider';
import { AdminTenantContextProvider } from './admin-tenant-context-provider';
import { LeftAdminMenu } from './left-admin-menu';
import { TopHeader } from './top-header';

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading, signOut, error } = useAdminSession();
  const isLoginRoute = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !session && !isLoginRoute) {
      router.replace('/login');
    }
  }, [isLoading, isLoginRoute, router, session]);

  useEffect(() => {
    if (!isLoading && session && pathname === '/') {
      router.replace(getDefaultAdminHref(session.isPlatformAdmin, session.tenantId));
    }
  }, [isLoading, pathname, router, session]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell admin-control-plane h-screen overflow-hidden bg-admin-bg text-admin-text">
      <AdminTenantContextProvider session={session}>
        <TopHeader session={session} signOut={signOut} />
        {error && session ? (
          <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="admin-shell__frame flex min-h-0 h-[calc(100vh-88px)]">
          <LeftAdminMenu session={session} />
          <div className="admin-shell__content flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <AdminContentRouter>{children}</AdminContentRouter>
          </div>
        </div>
      </AdminTenantContextProvider>
    </div>
  );
}
