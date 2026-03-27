'use client';

import type { AdminSession } from '../lib/admin-session';
import { AdminNav } from './admin-nav';
import { getAdminMenu } from './admin-route-config';
import { useAdminTenantContext } from './admin-tenant-context-provider';

type LeftAdminMenuProps = {
  session: AdminSession | null;
};

export function LeftAdminMenu({ session }: LeftAdminMenuProps) {
  const { selectedTenant, developerMode } = useAdminTenantContext();
  const menu = getAdminMenu(session, {
    selectedTenant,
    developerMode
  });

  if (!menu) {
    return (
      <aside className="admin-left-rail shrink-0 border-r border-admin-border xl:w-[420px] 2xl:w-[624px]">
        <div className="admin-left-rail__inner">
          <div className="admin-left-rail__brand">
            <div className="admin-left-rail__brand-mark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element -- platform logo is served from local static branding assets */}
              <img src="/branding/averra_logo_cutout.svg" alt="" className="admin-brand-logo" />
            </div>
          <div>
            <p className="admin-left-rail__eyebrow">averra platform</p>
            <h1 className="admin-left-rail__title">averra control plane</h1>
          </div>
          </div>
          <p className="text-sm text-admin-nav-muted">Admin session required.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="admin-left-rail shrink-0 border-r border-admin-border xl:w-[360px] 2xl:w-[400px]">
      <div className="admin-left-rail__inner">
        <div className="admin-left-rail__brand">
          <div className="admin-left-rail__brand-mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- platform logo is served from local static branding assets */}
            <img src="/branding/averra_logo_cutout.svg" alt="" className="admin-brand-logo" />
          </div>
          <div>
            <p className="admin-left-rail__eyebrow">averra platform</p>
            <h1 className="admin-left-rail__title">averra control plane</h1>
            <p className="admin-left-rail__description">
              Platform governance, tenant configuration, and shared service operations.
            </p>
          </div>
        </div>

        {selectedTenant ? (
          <div className="admin-left-rail__context-card">
            <span className="admin-left-rail__context-label">Selected tenant</span>
            <span className="admin-left-rail__context-value">{selectedTenant.name}</span>
          </div>
        ) : null}

        <AdminNav menu={menu} />
      </div>
    </aside>
  );
}
