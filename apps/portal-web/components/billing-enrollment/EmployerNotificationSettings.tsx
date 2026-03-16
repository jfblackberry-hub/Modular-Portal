'use client';

import { useState } from 'react';

import type { EmployerNotificationPreferences, EmployerNotificationType } from '../../lib/employer-notifications-tasks-data';

const categories: EmployerNotificationType[] = ['Enrollment', 'Billing', 'Compliance', 'Documents', 'System'];

export function EmployerNotificationSettings({ initialPreferences }: { initialPreferences: EmployerNotificationPreferences }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [message, setMessage] = useState('');

  function saveSettings() {
    setMessage('Notification preferences saved for your tenant (mock action).');
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Notifications &amp; Tasks</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Notification Settings</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">Configure portal and email delivery preferences by category. SMS is a future placeholder.</p>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delivery Channels</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.portalNotifications} onChange={(event) => setPreferences((current) => ({ ...current, portalNotifications: event.target.checked }))} className="mr-2" />
            Portal Notifications
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.emailNotifications} onChange={(event) => setPreferences((current) => ({ ...current, emailNotifications: event.target.checked }))} className="mr-2" />
            Email Notifications
          </label>
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
            <input type="checkbox" checked={preferences.smsNotifications} onChange={(event) => setPreferences((current) => ({ ...current, smsNotifications: event.target.checked }))} className="mr-2" />
            Future SMS (Placeholder)
          </label>
        </div>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Category Preferences</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <label key={category} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)]">
              <input type="checkbox" checked={preferences.categories[category]} onChange={(event) => setPreferences((current) => ({ ...current, categories: { ...current.categories, [category]: event.target.checked } }))} className="mr-2" />
              {category}
            </label>
          ))}
        </div>

        <button type="button" onClick={saveSettings} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Save Preferences</button>
        {message ? <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}
      </section>
    </div>
  );
}
