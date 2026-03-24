'use client';

import { AdminNav } from './admin-nav';
import { getAdminMenu } from './admin-route-config';
import type { AdminSession } from '../lib/admin-session';

type LeftAdminMenuProps = {
  session: AdminSession | null;
};

export function LeftAdminMenu({ session }: LeftAdminMenuProps) {
  const menu = getAdminMenu(session);

  if (!menu) {
    return (
      <aside className="admin-left-rail shrink-0 border-r border-admin-border xl:w-[420px] 2xl:w-[624px]">
        <div className="admin-left-rail__inner">
          <div className="admin-left-rail__brand">
            <div className="admin-left-rail__brand-mark" aria-hidden="true">
              P
            </div>
            <div>
              <p className="admin-left-rail__eyebrow">Platform Suite</p>
              <h1 className="admin-left-rail__title">Admin Portal</h1>
            </div>
          </div>
          <p className="text-sm text-admin-nav-muted">Admin session required.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="admin-left-rail shrink-0 border-r border-admin-border xl:w-[420px] 2xl:w-[624px]">
      <div className="admin-left-rail__inner">
        <div className="admin-left-rail__brand">
          <div className="admin-left-rail__brand-mark" aria-hidden="true">
            P
          </div>
          <div>
            <p className="admin-left-rail__eyebrow">Platform Suite</p>
            <h1 className="admin-left-rail__title">Platform Admin</h1>
            <p className="admin-left-rail__description">
              Operational control, tenant lifecycle management, and integration oversight in one workspace.
            </p>
          </div>
        </div>

        <div className="admin-left-rail__context-card">
          <span className="admin-left-rail__context-label">Current workspace</span>
          <span className="admin-left-rail__context-value">{menu.label}</span>
        </div>

        <AdminNav menu={menu} />
      </div>
    </aside>
  );
}
