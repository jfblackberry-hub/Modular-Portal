'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import type { PortalSessionUser } from '../../lib/portal-session';
import { stripPreviewHref } from '../../lib/preview-route';
import { prefixTenantAdminRoute, tenantAdminRoutes } from '../../lib/tenant-admin-routes';

const workspaceCards = [
  {
    title: 'Primary Workspace',
    description: 'Tenant-wide operations, access, and configuration.'
  },
  {
    title: 'Future Tabs',
    description: 'Ready for queued reviews, side-by-side tasks, and drill-in workflows.'
  }
];

export function TenantAdminShell({
  children,
  routePrefix,
  user
}: {
  children: ReactNode;
  routePrefix?: string;
  user: PortalSessionUser;
}) {
  const pathname = stripPreviewHref(routePrefix, usePathname());
  const activeRoute =
    tenantAdminRoutes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ??
    tenantAdminRoutes[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[320px] border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="border-b border-slate-800 px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Tenant Admin
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
            Workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Dedicated tenant operations, governance, access, and integration control.
          </p>
        </div>

        <nav aria-label="Tenant admin navigation" className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {tenantAdminRoutes.map((route) => {
            const active =
              pathname === route.href || pathname.startsWith(`${route.href}/`);

            return (
              <Link
                key={route.href}
                href={prefixTenantAdminRoute(routePrefix, route.href)}
                className={`block rounded-2xl border px-4 py-4 transition ${
                  active
                    ? 'border-slate-700 bg-slate-800 text-white shadow-sm'
                    : 'border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <p className="text-base font-semibold">{route.label}</p>
                <p className={`mt-1 text-sm leading-6 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                  {route.description}
                </p>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-4 py-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tenant Context
            </p>
            <p className="mt-2 text-base font-semibold text-white">{user.tenant.name}</p>
            <p className="mt-1 text-sm text-slate-400">Tenant-scoped admin session</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[320px]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tenant Admin Control Plane
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  {activeRoute.label}
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {user.tenant.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
                <p className="text-sm font-semibold text-slate-950">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500">{user.roles.join(', ')}</p>
              </div>

              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                User Menu
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">
          <section className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Workspace Navigation
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {tenantAdminRoutes.map((route) => {
                  const active =
                    pathname === route.href || pathname.startsWith(`${route.href}/`);

                  return (
                    <Link
                      key={route.href}
                      href={prefixTenantAdminRoute(routePrefix, route.href)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {route.shortLabel}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              {workspaceCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
