'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import type { PortalNavigationSection } from '../lib/navigation';
import { prefixPreviewHref, stripPreviewHref } from '../lib/preview-route';
import type { TenantBranding } from '../lib/tenant-branding';

export function SideNavigation({
  branding,
  routePrefix,
  sections
}: {
  branding: TenantBranding;
  routePrefix?: string;
  sections: PortalNavigationSection[];
}) {
  const pathname = stripPreviewHref(routePrefix, usePathname());
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
        className="tenant-side-nav tenant-side-nav--mobile portal-card sticky bottom-3 z-20 flex items-center justify-between gap-2 overflow-x-auto px-3 py-3 lg:hidden"
      >
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={prefixPreviewHref(routePrefix, item.href)}
            className={`tenant-side-nav__item tenant-side-nav__item--mobile flex min-w-[78px] flex-1 flex-col items-center rounded-2xl px-3 py-3 text-center text-[12px] font-semibold ${
              isActive(item.href)
            ? 'tenant-side-nav__item--active bg-[var(--tenant-primary-soft-color)]'
                : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <aside className="hidden lg:block">
        <div className="tenant-side-nav tenant-side-nav--desktop sticky top-6 rounded-2xl border border-[var(--border-subtle)] bg-white p-4">
          <div className="tenant-side-nav__header mb-4 border-b border-[var(--border-subtle)] pb-4">
            <p className="tenant-side-nav__title text-sm font-semibold">
              {primarySectionTitle}
            </p>
            <p className="tenant-side-nav__description mt-2 text-xs leading-5">
              {primarySectionDescription}
            </p>
          </div>

          <nav className="tenant-side-nav__sections space-y-5" aria-label="Primary desktop navigation">
            {sections.map((section) => (
              <div key={section.title} className="tenant-side-nav__section">
                <p className="tenant-side-nav__section-title text-[12px] font-semibold">
                  {section.title}
                </p>
                <div className="tenant-side-nav__section-items mt-3 space-y-2">
                  {section.items.map((item) => {
                    const active = !item.external && isActive(item.href.split('#')[0] ?? item.href);
                    const className = active
                      ? 'tenant-side-nav__item--active border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)]'
                      : 'border-transparent hover:border-[var(--border-subtle)] hover:bg-slate-50/70';

                    if (item.external) {
                      return (
                        <a
                          key={item.href}
                          href={prefixPreviewHref(routePrefix, item.href)}
                          target="_blank"
                          rel="noreferrer"
                          className={`tenant-side-nav__item block rounded-xl border px-3 py-3 transition ${className}`}
                        >
                          <p className="tenant-side-nav__item-label text-sm font-semibold">{item.label}</p>
                          <p className="tenant-side-nav__item-description mt-1 text-xs leading-5">
                            {item.description}
                          </p>
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={item.href}
                        href={prefixPreviewHref(routePrefix, item.href)}
                        className={`tenant-side-nav__item block rounded-xl border px-3 py-3 transition ${className}`}
                      >
                        <p className="tenant-side-nav__item-label text-sm font-semibold">{item.label}</p>
                        <p className="tenant-side-nav__item-description mt-1 text-xs leading-5">
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
