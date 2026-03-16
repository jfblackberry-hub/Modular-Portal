import Link from 'next/link';

import type { EmployerAdministrationSummary } from '../../lib/employer-admin-settings-data';
import { StatusBadge } from '../portal-ui';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

const quickLinks = [
  { label: 'Employer Profile', href: '/dashboard/billing-enrollment/administration/profile' },
  { label: 'Manage Administrators', href: '/dashboard/billing-enrollment/administration/users' },
  { label: 'Billing Preferences', href: '/dashboard/billing-enrollment/administration/billing-preferences' },
  { label: 'Notification Settings', href: '/dashboard/billing-enrollment/administration/notification-settings' },
  { label: 'Integration Settings', href: '/dashboard/billing-enrollment/administration/integrations' }
] as const;

export function EmployerAdministrationHome({ summary }: { summary: EmployerAdministrationSummary }) {
  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Administration</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Employer Administration &amp; Settings</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">Manage organization profile, administrators, billing and notification preferences, and integration placeholders.</p>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {quickLinks.map((item) => (
            <Link key={item.label} href={item.href} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-[var(--tenant-primary-soft-color)]">
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Administrators</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.administratorsCount}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Active Admins</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.activeAdministratorsCount}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Billing Config</p>
          <div className="mt-2"><StatusBadge label={summary.billingConfigured ? 'Configured' : 'Missing Billing Contact'} /></div>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Notifications</p>
          <div className="mt-2"><StatusBadge label={summary.notificationsConfigured ? 'Configured' : 'Disabled'} /></div>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Integrations</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.integrationsConfigured}</p>
        </article>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Administrative Audit Log</h2>
        <ul className="mt-4 space-y-2">
          {summary.auditEvents.map((event) => (
            <li key={event.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[var(--text-primary)]">{event.actionType}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDateTime(event.timestamp)}</p>
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.actor}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Affected item: {event.affectedItem}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
