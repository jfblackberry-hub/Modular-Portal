'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { getAdminRoute } from './admin-route-config';

type AdminContentRouterProps = {
  children: ReactNode;
};

export function AdminContentRouter({ children }: AdminContentRouterProps) {
  const pathname = usePathname();
  const route = getAdminRoute(pathname);

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-admin-bg">
      <div className="border-b border-admin-border bg-white/70 px-8 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-admin-accent">
          {route ? route.label : 'Admin'}
        </p>
        <p className="mt-2 text-sm text-admin-muted">
          {route?.description ?? 'Select an admin workspace route from the left menu.'}
        </p>
      </div>

      <div className="px-8 py-8">{children}</div>
    </main>
  );
}
