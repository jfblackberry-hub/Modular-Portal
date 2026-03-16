'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { EmployerNotificationRecord, EmployerNotificationType } from '../../lib/employer-notifications-tasks-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type Filters = {
  query: string;
  type: 'all' | EmployerNotificationType;
  status: 'all' | 'Read' | 'Unread';
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function EmployerNotificationsCenter({ notifications }: { notifications: EmployerNotificationRecord[] }) {
  const [filters, setFilters] = useState<Filters>({ query: '', type: 'all', status: 'all' });
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    return notifications.filter((notification) => {
      const searchable = `${notification.id} ${notification.message} ${notification.notificationType}`.toLowerCase();
      const queryMatch = !normalizedQuery || searchable.includes(normalizedQuery);
      const typeMatch = filters.type === 'all' || notification.notificationType === filters.type;
      const statusMatch = filters.status === 'all' || notification.readStatus === filters.status;
      return queryMatch && typeMatch && statusMatch;
    });
  }, [notifications, filters]);

  function markAllRead() {
    const unreadCount = notifications.filter((item) => item.readStatus === 'Unread').length;
    setMessage(`${unreadCount} notifications marked read (mock action).`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Notifications &amp; Tasks</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Notifications Center
        </h1>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Search</span>
            <input type="search" value={filters.query} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Search by message or ID" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Type</span>
            <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as Filters['type'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All types</option>
              <option value="Enrollment">Enrollment</option>
              <option value="Billing">Billing</option>
              <option value="Compliance">Compliance</option>
              <option value="Documents">Documents</option>
              <option value="System">System</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Read Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as Filters['status'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={markAllRead} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Mark All Read</button>
          <Link href="/dashboard/billing-enrollment/notifications/settings" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Manage Notification Settings</Link>
        </div>
        {message ? <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</p> : null}
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">System Notifications</h2>
          <p className="text-sm text-[var(--text-secondary)]">Showing {filtered.length} of {notifications.length}</p>
        </div>

        {notifications.length === 0 ? (
          <div className="mt-4"><EmptyState title="No notifications" description="System updates and alerts will appear here." /></div>
        ) : filtered.length === 0 ? (
          <div className="mt-4"><EmptyState title="No matching notifications" description="Adjust filter criteria to find notifications." /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Notification ID</th>
                  <th>Notification Type</th>
                  <th>Message</th>
                  <th>Created Date</th>
                  <th>Read/Unread</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.id}</td>
                    <td>{notification.notificationType}</td>
                    <td>{notification.message}</td>
                    <td>{formatDate(notification.createdDate)}</td>
                    <td><StatusBadge label={notification.readStatus} /></td>
                    <td><StatusBadge label={notification.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
