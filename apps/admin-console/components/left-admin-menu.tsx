'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { AdminSession } from './admin-session-provider';
import { getAdminMenu } from './admin-route-config';

type LeftAdminMenuProps = {
  session: AdminSession | null;
};

export function LeftAdminMenu({ session }: LeftAdminMenuProps) {
  const pathname = usePathname();
  const menu = getAdminMenu(session);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!menu) {
      return;
    }

    setCollapsedSections((current) => {
      const nextState = { ...current };

      for (const section of menu.sections) {
        if (!(section.key in nextState)) {
          nextState[section.key] = false;
        }
      }

      return nextState;
    });
  }, [menu]);

  if (!menu) {
    return (
      <aside className="admin-left-nav min-h-screen w-[425px] shrink-0 overflow-y-auto border-r border-admin-border text-slate-50">
        <div className="px-6 py-8">
          <p className="text-sm text-slate-300">Admin session required.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="admin-left-nav min-h-screen w-[425px] shrink-0 overflow-y-auto border-r border-admin-border text-slate-50">
      <div className="flex min-h-screen flex-col px-6 py-8 pb-16">
        <div>
          <div className="admin-left-nav__brand">
            <div className="admin-left-nav__brand-icon" aria-hidden="true">A</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300">
                Admin Console
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Control Plane
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Command-center navigation for platform operations, tenant configuration, and support workflows.
          </p>
        </div>

        <div className="admin-left-nav__access mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
            Access
          </p>
          <p className="mt-2 text-sm font-medium text-white">{menu.label}</p>
        </div>

        <nav className="admin-left-nav__nav mt-10 flex-1 space-y-4 pb-8">
          {menu.sections.map((section) => {
            const isSectionActive = section.items.some(
              (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
            );
            const isCollapsed = collapsedSections[section.key] ?? false;

            return (
              <div key={section.key} className="admin-left-nav__section rounded-3xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsedSections((current) => ({
                      ...current,
                      [section.key]: !isCollapsed
                    }))
                  }
                  className={`admin-left-nav__section-toggle flex w-full items-center justify-between px-4 py-3 text-left transition ${
                    isSectionActive ? 'text-white' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em]">
                    <span aria-hidden="true">•</span>
                    {section.label}
                  </span>
                  <span className="text-sm">{isCollapsed ? '+' : '-'}</span>
                </button>

                {!isCollapsed ? (
                  <div className="admin-left-nav__section-items space-y-2 border-t border-white/10 px-3 py-3">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          scroll={false}
                          className={`admin-left-nav__item ${isActive ? 'admin-left-nav__item--active' : ''} block rounded-2xl border px-4 py-3 transition ${
                            isActive
                              ? 'border-sky-300/60 bg-white/10 text-white'
                              : 'border-white/10 text-slate-200 hover:border-sky-300/40 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="admin-left-nav__item-label text-sm font-medium">{item.label}</div>
                          <div className="admin-left-nav__item-description mt-1 text-xs leading-5 text-slate-400">
                            {item.description}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
