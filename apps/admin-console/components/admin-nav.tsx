'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  AppWindow,
  Blocks,
  BookMarked,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
  Users2,
  Waypoints
} from 'lucide-react';

import type { AdminMenuConfig, AdminMenuItem, AdminSectionIcon } from './admin-route-config';

const SECTION_ICON_MAP = {
  dashboard: LayoutDashboard,
  tenants: Building2,
  users: Users2,
  roles: ShieldCheck,
  modules: Blocks,
  'api-catalog': BookMarked,
  audit: AppWindow,
  integrations: Waypoints
} satisfies Record<AdminSectionIcon, typeof LayoutDashboard>;

function isItemActive(pathname: string, item: AdminMenuItem): boolean {
  const matchesSelf = item.href
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

  return matchesSelf || (item.items?.some((child) => isItemActive(pathname, child)) ?? false);
}

function collectExpandedState(items: AdminMenuItem[], pathname: string) {
  return items.reduce<Record<string, boolean>>((accumulator, item) => {
    if (item.items?.length) {
      accumulator[item.key] = isItemActive(pathname, item);
      Object.assign(accumulator, collectExpandedState(item.items, pathname));
    }

    return accumulator;
  }, {});
}

function NavBranch({
  item,
  depth = 0,
  expanded,
  onToggle,
  pathname
}: {
  item: AdminMenuItem;
  depth?: number;
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  pathname: string;
}) {
  const hasChildren = (item.items?.length ?? 0) > 0;
  const isActive = isItemActive(pathname, item);
  const isExpanded = expanded[item.key] ?? false;

  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        scroll={false}
        className={`admin-nav__item ${isActive ? 'admin-nav__item--active' : ''}`}
        style={{ '--admin-nav-depth': depth } as CSSProperties}
      >
        <span className="admin-nav__item-line" />
        <ChevronRight size={16} className={`admin-nav__item-icon ${isActive ? 'admin-nav__item-icon--active' : ''}`} />
        <span className="admin-nav__item-copy">
          <span className="admin-nav__item-label">{item.label}</span>
          {item.description ? (
            <span className="admin-nav__item-description">{item.description}</span>
          ) : null}
        </span>
      </Link>
    );
  }

  return (
    <div className={`admin-nav__group ${isActive ? 'admin-nav__group--active' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(item.key)}
        aria-expanded={isExpanded}
        className={`admin-nav__group-toggle ${isActive ? 'admin-nav__group-toggle--active' : ''}`}
        style={{ '--admin-nav-depth': depth } as CSSProperties}
      >
        <span className="admin-nav__item-line" />
        <ChevronRight size={16} className={`admin-nav__item-icon ${isActive ? 'admin-nav__item-icon--active' : ''}`} />
        <span className="admin-nav__item-copy">
          <span className="admin-nav__item-label">{item.label}</span>
          {item.description ? (
            <span className="admin-nav__item-description">{item.description}</span>
          ) : null}
        </span>
        <ChevronDown
          size={16}
          className={`admin-nav__chevron ${isExpanded ? 'admin-nav__chevron--open' : ''}`}
        />
      </button>

      {isExpanded ? (
        <div className="admin-nav__children">
          {item.items?.map((child) => (
            <NavBranch
              key={child.key}
              item={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              pathname={pathname}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminNav({ menu }: { menu: AdminMenuConfig }) {
  const pathname = usePathname();
  const defaultExpanded = useMemo(
    () => collectExpandedState(menu.sections.flatMap((section) => section.items), pathname),
    [menu.sections, pathname]
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpanded((current) => ({ ...defaultExpanded, ...current }));
  }, [defaultExpanded]);

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
                  <NavBranch
                    key={item.key}
                    item={item}
                    expanded={expanded}
                    onToggle={(key) =>
                      setExpanded((current) => ({
                        ...current,
                        [key]: !(current[key] ?? false)
                      }))
                    }
                    pathname={pathname}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
