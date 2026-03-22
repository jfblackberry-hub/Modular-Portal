'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { AdminSession } from './admin-session-provider';
import type { AdminMenuItem } from './admin-route-config';
import { getAdminMenu } from './admin-route-config';

type LeftAdminMenuProps = {
  session: AdminSession | null;
};

function isItemActive(pathname: string, item: AdminMenuItem): boolean {
  const matchesSelf = item.href
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

  return matchesSelf || (item.items?.some((child) => isItemActive(pathname, child)) ?? false);
}

function collectExpandableState(items: AdminMenuItem[], pathname: string) {
  return items.reduce<Record<string, boolean>>((accumulator, item) => {
    if (item.items?.length) {
      accumulator[item.key] = isItemActive(pathname, item);
      Object.assign(accumulator, collectExpandableState(item.items, pathname));
    }

    return accumulator;
  }, {});
}

function MenuBranch({
  item,
  pathname,
  expanded,
  onToggle,
  depth = 0
}: {
  item: AdminMenuItem;
  pathname: string;
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  depth?: number;
}) {
  const hasChildren = (item.items?.length ?? 0) > 0;
  const isActive = isItemActive(pathname, item);
  const isExpanded = expanded[item.key] ?? false;

  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        scroll={false}
        className={`admin-left-nav__link ${isActive ? 'admin-left-nav__link--active' : ''}`}
        style={{ '--nav-depth': depth } as CSSProperties}
      >
        <span className="admin-left-nav__link-label">{item.label}</span>
        {item.description ? (
          <span className="admin-left-nav__link-description">{item.description}</span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className={`admin-left-nav__branch ${isActive ? 'admin-left-nav__branch--active' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(item.key)}
        className={`admin-left-nav__branch-toggle ${isActive ? 'admin-left-nav__branch-toggle--active' : ''}`}
        style={{ '--nav-depth': depth } as CSSProperties}
        aria-expanded={isExpanded}
      >
        <span className="admin-left-nav__branch-copy">
          <span className="admin-left-nav__branch-label">{item.label}</span>
          {item.description ? (
            <span className="admin-left-nav__branch-description">{item.description}</span>
          ) : null}
        </span>
        <span className={`admin-left-nav__branch-chevron ${isExpanded ? 'admin-left-nav__branch-chevron--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {isExpanded ? (
        <div className="admin-left-nav__branch-children">
          {item.items?.map((child) => (
            <MenuBranch
              key={child.key}
              item={child}
              pathname={pathname}
              expanded={expanded}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function LeftAdminMenu({ session }: LeftAdminMenuProps) {
  const pathname = usePathname();
  const menu = getAdminMenu(session);
  const defaultExpanded = useMemo(
    () => (menu ? collectExpandableState(menu.sections.flatMap((section) => section.items), pathname) : {}),
    [menu, pathname]
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpanded((current) => ({ ...defaultExpanded, ...current }));
  }, [defaultExpanded]);

  if (!menu) {
    return (
      <aside className="admin-left-nav w-[624px] shrink-0 border-r border-admin-border">
        <div className="admin-left-nav__inner">
          <p className="text-sm text-admin-muted">Admin session required.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="admin-left-nav w-[624px] shrink-0 border-r border-admin-border">
      <div className="admin-left-nav__inner">
        <div className="admin-left-nav__brand-panel">
          <div className="admin-left-nav__brand-mark" aria-hidden="true">
            A
          </div>
          <div>
            <p className="admin-left-nav__eyebrow">Admin Console</p>
            <h1 className="admin-left-nav__title">Control Plane</h1>
            <p className="admin-left-nav__intro">
              Minimal navigation for platform operations, tenant setup, and support workflows.
            </p>
          </div>
        </div>

        <div className="admin-left-nav__access">
          <span className="admin-left-nav__access-label">Workspace</span>
          <span className="admin-left-nav__access-value">{menu.label}</span>
        </div>

        <nav aria-label="Admin navigation" className="admin-left-nav__sections">
          {menu.sections.map((section) => (
            <section key={section.key} className="admin-left-nav__section">
              <div className="admin-left-nav__section-header">
                <p className="admin-left-nav__section-title">{section.label}</p>
              </div>
              <div className="admin-left-nav__section-links">
                {section.items.map((item) => (
                  <MenuBranch
                    key={item.key}
                    item={item}
                    pathname={pathname}
                    expanded={expanded}
                    onToggle={(key) =>
                      setExpanded((current) => ({
                        ...current,
                        [key]: !(current[key] ?? false)
                      }))
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
      </div>
    </aside>
  );
}
