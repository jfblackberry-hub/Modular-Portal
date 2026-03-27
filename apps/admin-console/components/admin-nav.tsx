'use client';

import {
  Building2,
  ChevronDown,
  ChevronRight,
  Code2,
  Layers3,
  LayoutDashboard,
  Network,
  ShieldCheck,
  Users2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useState } from 'react';

import type { AdminMenuConfig, AdminMenuItem, AdminSectionIcon } from './admin-route-config';

const SECTION_ICON_MAP = {
  overview: LayoutDashboard,
  tenants: Building2,
  tenant: Users2,
  shared: Layers3,
  governance: ShieldCheck,
  operations: Network,
  developer: Code2
} satisfies Record<AdminSectionIcon, typeof LayoutDashboard>;

function isItemActive(pathname: string, item: AdminMenuItem): boolean {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav({ menu }: { menu: AdminMenuConfig }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Admin navigation" className="admin-nav">
      {menu.sections.map((section) => {
        const Icon = SECTION_ICON_MAP[section.icon];

        return (
          <section key={section.key} className="admin-nav__section">
            <button
              type="button"
              onClick={() =>
                setExpanded((current) => ({
                  ...current,
                  [section.key]: !(current[section.key] ?? true)
                }))
              }
                className="admin-nav__section-header"
              aria-expanded={expanded[section.key] ?? true}
            >
              <span className="admin-nav__section-heading">
                <Icon size={16} className="admin-nav__section-icon" />
                <span>{section.label}</span>
              </span>
              <ChevronDown
                size={16}
                className={`admin-nav__chevron ${expanded[section.key] ?? true ? 'admin-nav__chevron--open' : ''}`}
              />
            </button>

            {expanded[section.key] ?? true ? (
              <div className="admin-nav__section-items">
                {section.items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    scroll={false}
                    className={`admin-nav__item ${isItemActive(pathname, item) ? 'admin-nav__item--active' : ''}`}
                    style={{ '--admin-nav-depth': 0 } as CSSProperties}
                  >
                    <span className="admin-nav__item-line" />
                    <ChevronRight size={16} className={`admin-nav__item-icon ${isItemActive(pathname, item) ? 'admin-nav__item-icon--active' : ''}`} />
                    <span className="admin-nav__item-copy">
                      <span className="admin-nav__item-label">{item.label}</span>
                      {item.description ? (
                        <span className="admin-nav__item-description">{item.description}</span>
                      ) : null}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
