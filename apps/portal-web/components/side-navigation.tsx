'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { PortalNavigationSection } from '../lib/navigation';
import type { TenantBranding } from '../lib/tenant-branding';

export function SideNavigation({
  branding,
  sections
}: {
  branding: TenantBranding;
  sections: PortalNavigationSection[];
}) {
  const pathname = usePathname();
  const flatItems = sections.flatMap((section) => section.items).filter((item) => !item.external);
  const mobileItems = flatItems.slice(0, 4);
  const primarySectionTitle = sections[0]?.title ?? 'Portal';
  const primarySectionDescription =
    primarySectionTitle === 'Employer portal'
      ? 'Quick access to enrollment, billing, document, and reporting workflows.'
      : 'Quick access to benefits, claims, care search, and support tools.';

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav
        aria-label="Primary mobile navigation"
        className="portal-card sticky bottom-3 z-20 flex items-center justify-between gap-2 overflow-x-auto px-3 py-3 lg:hidden"
      >
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-[78px] flex-1 flex-col items-center rounded-2xl px-3 py-3 text-center text-[12px] font-semibold ${
              isActive(item.href)
                ? 'bg-[var(--tenant-primary-soft-color)] text-[var(--tenant-primary-color)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <aside className="hidden lg:block">
        <div className="portal-card sticky top-6 p-6">
          <div className="mb-6 border-b border-[var(--border-subtle)] pb-5">
            <p
              className="text-base font-semibold"
              style={{ color: branding.primaryColor }}
            >
              {primarySectionTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {primarySectionDescription}
            </p>
          </div>

          <nav className="space-y-7" aria-label="Primary desktop navigation">
            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-[12px] font-semibold text-[var(--text-muted)]">
                  {section.title}
                </p>
                <div className="mt-3 space-y-2">
                  {section.items.map((item) => {
                    const active = !item.external && isActive(item.href.split('#')[0] ?? item.href);
                    const className = active
                      ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)] text-[var(--tenant-primary-color)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-slate-50 hover:text-[var(--text-primary)]';

                    if (item.external) {
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`block rounded-2xl border px-4 py-4 transition ${className}`}
                        >
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                            {item.description}
                          </p>
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-2xl border px-4 py-4 transition ${className}`}
                      >
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                          {item.description}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
