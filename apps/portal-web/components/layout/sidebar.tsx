'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  CircleHelp,
  CreditCard,
  FileHeart,
  FileText,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  X
} from 'lucide-react';
import type { PortalSessionUser } from '../../lib/portal-session';
import type { TenantPortalModuleId } from '../../lib/tenant-modules';
import { isTenantModuleEnabledForUser } from '../../lib/tenant-modules';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  moduleId: TenantPortalModuleId;
};

const navItems: NavItem[] = [
  { href: '/member', icon: Home, label: 'Home', moduleId: 'member_home' },
  { href: '/dashboard/benefits', icon: FileHeart, label: 'My Plan', moduleId: 'member_benefits' },
  { href: '/member/claims', icon: FileText, label: 'Claims', moduleId: 'member_claims' },
  { href: '/dashboard/providers', icon: MapPin, label: 'Find Care', moduleId: 'member_providers' },
  { href: '/member/documents', icon: FileText, label: 'Documents', moduleId: 'member_documents' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages', moduleId: 'member_messages' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing', moduleId: 'member_billing' },
  { href: '/dashboard/help', icon: CircleHelp, label: 'Support', moduleId: 'member_support' }
];

function NavLinks({
  collapsed,
  onNavigate,
  user
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  user: PortalSessionUser;
}) {
  const pathname = usePathname();
  const enabledNavItems = navItems.filter((item) => isTenantModuleEnabledForUser(user, item.moduleId));

  return (
    <nav aria-label="Portal navigation" className="space-y-1.5">
      {enabledNavItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center rounded-xl border px-3 py-2 text-sm font-medium transition ${
              active
                ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)] text-[var(--tenant-primary-color)]'
                : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-slate-50 hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={18} className="shrink-0" />
            <span className={collapsed ? 'sr-only' : 'ml-3'}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  isMobileOpen,
  onCloseMobile,
  user
}: {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  user: PortalSessionUser;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={`hidden border-r border-[var(--border-subtle)] bg-white lg:block ${
          collapsed ? 'w-[84px]' : 'w-[248px]'
        }`}
      >
        <div className="sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto px-3 py-4">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
          >
            <Menu size={16} />
          </button>
          <NavLinks collapsed={collapsed} user={user} />
        </div>
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45"
            aria-label="Close navigation drawer"
            onClick={onCloseMobile}
          />
          <aside className="relative h-full w-[280px] border-r border-[var(--border-subtle)] bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Navigation</p>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>
            <NavLinks collapsed={false} onNavigate={onCloseMobile} user={user} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
