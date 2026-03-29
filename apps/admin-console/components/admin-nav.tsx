'use client';

import {
  Building2,
  ChevronDown,
  ClipboardList,
  Code2,
  Layers3,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Users2
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';

import type { AdminMenuConfig, AdminMenuItem, AdminSectionIcon } from './admin-route-config';

const EXPANDED_SECTION_STORAGE_KEY = 'admin-control-plane:nav-expanded-section';

const SECTION_ICON_MAP = {
  'access-control': ShieldCheck,
  'audit-operations': ClipboardList,
  configuration: Settings2,
  developer: Code2,
  overview: LayoutDashboard,
  'shared-services': Layers3,
  'tenant-management': Building2,
  'tenant-workspace': Users2
} satisfies Record<AdminSectionIcon, typeof LayoutDashboard>;

function isItemActive(pathname: string, item: AdminMenuItem) {
  const candidates = [item.href, ...(item.aliases ?? [])];

  return candidates.some(
    (candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`)
  );
}

type AdminNavProps = {
  collapsed?: boolean;
  menu: AdminMenuConfig;
  onExpandFromCollapsed?: (sectionKey: string) => void;
};

export function AdminNav({
  collapsed = false,
  menu,
  onExpandFromCollapsed
}: AdminNavProps) {
  const pathname = usePathname();
  const fallbackSectionKey = menu.sections[0]?.key ?? null;
  const [expandedSectionKey, setExpandedSectionKey] = useState<string | null>(fallbackSectionKey);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Keep expansion deterministic: the active section wins on navigation, otherwise
    // restore the user's last explicitly opened section for this admin session.
    const activeKey = menu.sections.find((section) =>
      section.items.some((item) => isItemActive(pathname, item))
    )?.key;
    const storedKey = window.sessionStorage.getItem(EXPANDED_SECTION_STORAGE_KEY);
    const nextKey =
      activeKey && menu.sections.some((section) => section.key === activeKey)
        ? activeKey
        : storedKey && menu.sections.some((section) => section.key === storedKey)
          ? storedKey
          : fallbackSectionKey;

    setExpandedSectionKey(nextKey);
  }, [fallbackSectionKey, menu.sections, pathname]);

  useEffect(() => {
    if (!expandedSectionKey || typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(EXPANDED_SECTION_STORAGE_KEY, expandedSectionKey);
  }, [expandedSectionKey]);

  if (collapsed) {
    return (
      <nav aria-label="Admin navigation" className="admin-nav admin-nav--collapsed">
        <div className="admin-nav__collapsed-rail">
          {menu.sections.map((section) => {
            const Icon = SECTION_ICON_MAP[section.icon];
            const sectionIsActive = section.items.some((item) => isItemActive(pathname, item));

            return (
              <button
                key={section.key}
                type="button"
                title={section.label}
                aria-label={section.label}
                className={`admin-nav__collapsed-button ${sectionIsActive ? 'admin-nav__collapsed-button--active' : ''}`}
                onClick={() => {
                  setExpandedSectionKey(section.key);
                  onExpandFromCollapsed?.(section.key);
                }}
              >
                <Icon size={18} />
                <span className="sr-only">{section.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Admin navigation" className="admin-nav">
      {menu.sections.map((section) => {
        const Icon = SECTION_ICON_MAP[section.icon];
        const sectionIsActive = section.items.some((item) => isItemActive(pathname, item));
        const isExpanded = expandedSectionKey === section.key;

        return (
          <section
            key={section.key}
            className={`admin-nav__section ${sectionIsActive ? 'admin-nav__section--active' : ''}`}
          >
            <button
              type="button"
              className={`admin-nav__section-header ${isExpanded ? 'admin-nav__section-header--expanded' : ''}`}
              aria-expanded={isExpanded}
              onClick={() => setExpandedSectionKey(section.key)}
            >
              <span className="admin-nav__section-heading">
                <Icon size={16} className="admin-nav__section-icon" />
                <span>{section.label}</span>
              </span>
              <ChevronDown
                size={16}
                className={`admin-nav__chevron ${isExpanded ? 'admin-nav__chevron--open' : ''}`}
              />
            </button>

            {isExpanded ? (
              <div className="admin-nav__section-items">
                {section.items.map((item) => {
                  const active = isItemActive(pathname, item);

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      scroll={false}
                      className={`admin-nav__item ${active ? 'admin-nav__item--active' : ''}`}
                      style={{ '--admin-nav-depth': 0 } as CSSProperties}
                    >
                      <span className="admin-nav__item-line" />
                      <span className="admin-nav__item-copy">
                        <span className="admin-nav__item-label">{item.label}</span>
                        {item.description ? (
                          <span className="admin-nav__item-description">{item.description}</span>
                        ) : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
