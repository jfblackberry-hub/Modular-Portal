'use client';

import { useState } from 'react';

import type { AdminNotificationPreferences } from '../../lib/employer-admin-settings-data';

export function EmployerAdminNotificationSettings({
  initialPreferences
}: {
  initialPreferences: AdminNotificationPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [message, setMessage] = useState('');

  function saveNotificationSettings() {
    setMessage('Notification settings updated (mock action with audit log event).');
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Administration</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Notification Settings</h1>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification Categories</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.categories.enrollment} onChange={(event) => setPreferences((current) => ({ ...current, categories: { ...current.categories, enrollment: event.target.checked } }))} className="mr-2" />
            Enrollment notifications
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.categories.billing} onChange={(event) => setPreferences((current) => ({ ...current, categories: { ...current.categories, billing: event.target.checked } }))} className="mr-2" />
            Billing notifications
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.categories.compliance} onChange={(event) => setPreferences((current) => ({ ...current, categories: { ...current.categories, compliance: event.target.checked } }))} className="mr-2" />
            Compliance alerts
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.categories.documents} onChange={(event) => setPreferences((current) => ({ ...current, categories: { ...current.categories, documents: event.target.checked } }))} className="mr-2" />
            Document notifications
          </label>
        </div>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delivery Channels</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.channels.portal} onChange={(event) => setPreferences((current) => ({ ...current, channels: { ...current.channels, portal: event.target.checked } }))} className="mr-2" />
            Portal
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.channels.email} onChange={(event) => setPreferences((current) => ({ ...current, channels: { ...current.channels, email: event.target.checked } }))} className="mr-2" />
            Email
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.channels.sms} onChange={(event) => setPreferences((current) => ({ ...current, channels: { ...current.channels, sms: event.target.checked } }))} className="mr-2" />
            Future SMS placeholder
          </label>
        </div>

        <button type="button" onClick={saveNotificationSettings} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Save Notification Settings</button>
        {message ? <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}
      </section>
    </div>
  );
}
