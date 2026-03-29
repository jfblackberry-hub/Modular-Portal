'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { AdminSession } from '../lib/admin-session';
import { AdminNav } from './admin-nav';
import { getAdminMenu } from './admin-route-config';
import { useAdminTenantContext } from './admin-tenant-context-provider';

type LeftAdminMenuProps = {
  session: AdminSession | null;
};

const NAV_COLLAPSED_STORAGE_KEY = 'admin-control-plane:nav-collapsed';

export function LeftAdminMenu({ session }: LeftAdminMenuProps) {
  const { selectedTenant, developerMode } = useAdminTenantContext();
  const [collapsed, setCollapsed] = useState(false);
  const menu = getAdminMenu(session, {
    developerMode,
    selectedTenant
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setCollapsed(window.sessionStorage.getItem(NAV_COLLAPSED_STORAGE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(
      NAV_COLLAPSED_STORAGE_KEY,
      collapsed ? 'true' : 'false'
    );
  }, [collapsed]);

  if (!menu) {
    return (
      <aside className="admin-left-rail shrink-0 border-r border-admin-border xl:w-[420px] 2xl:w-[624px]">
        <div className="admin-left-rail__inner">
          <div className="admin-left-rail__toolbar">
            <span className="text-sm font-medium text-admin-muted">Navigation</span>
          </div>
          <p className="text-sm text-admin-nav-muted">Admin session required.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`admin-left-rail min-h-0 shrink-0 overflow-hidden border-r border-admin-border ${
        collapsed ? 'admin-left-rail--collapsed xl:w-[96px] 2xl:w-[96px]' : 'xl:w-[360px] 2xl:w-[400px]'
      }`}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className="admin-left-rail__inner">
        <div className="admin-left-rail__toolbar">
          {!collapsed ? (
            <div className="admin-left-rail__toolbar-copy">
              <p className="admin-left-rail__eyebrow">Navigation</p>
              <p className="admin-left-rail__description">
                Platform administration, tenant management, and operations.
              </p>
            </div>
          ) : null}
          <button
            type="button"
            className="admin-left-rail__toggle"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {!collapsed && selectedTenant ? (
          <div className="admin-left-rail__context-card">
            <span className="admin-left-rail__context-label">Selected tenant</span>
            <span className="admin-left-rail__context-value">{selectedTenant.name}</span>
          </div>
        ) : null}

        <div className="admin-left-rail__nav-panel">
          <AdminNav
            collapsed={collapsed}
            menu={menu}
            onExpandFromCollapsed={() => setCollapsed(false)}
          />
        </div>
      </div>
    </aside>
  );
}
