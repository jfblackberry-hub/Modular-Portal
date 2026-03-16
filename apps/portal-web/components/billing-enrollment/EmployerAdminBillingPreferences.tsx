'use client';

import { useState } from 'react';

import type { BillingPreferences } from '../../lib/employer-admin-settings-data';

export function EmployerAdminBillingPreferences({ initialPreferences }: { initialPreferences: BillingPreferences }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function savePreferences() {
    setMessage('');
    setError('');

    if (!preferences.billingContactName.trim() || !preferences.billingContactEmail.trim()) {
      setError('Missing billing contact. Add name and email before saving.');
      return;
    }

    if (!preferences.billingContactEmail.includes('@')) {
      setError('Invalid contact information: billing contact email is invalid.');
      return;
    }

    setMessage('Billing preferences updated (mock action with audit log event).');
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Administration</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Billing Preferences</h1>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm text-[var(--text-primary)] sm:col-span-2">
            <input type="checkbox" checked={preferences.autoPayEnabled} onChange={(event) => setPreferences((current) => ({ ...current, autoPayEnabled: event.target.checked }))} className="mr-2" />
            Enable AutoPay (placeholder)
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Billing Contact Name</span>
            <input value={preferences.billingContactName} onChange={(event) => setPreferences((current) => ({ ...current, billingContactName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Billing Contact Email</span>
            <input value={preferences.billingContactEmail} onChange={(event) => setPreferences((current) => ({ ...current, billingContactEmail: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Billing Contact Phone</span>
            <input value={preferences.billingContactPhone} onChange={(event) => setPreferences((current) => ({ ...current, billingContactPhone: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Invoice Delivery Preferences</span>
            <select value={preferences.invoiceDelivery} onChange={(event) => setPreferences((current) => ({ ...current, invoiceDelivery: event.target.value as BillingPreferences['invoiceDelivery'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="Email">Email</option>
              <option value="Portal">Portal</option>
              <option value="Email and Portal">Email and Portal</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Preferred Payment Method</span>
            <select value={preferences.preferredPaymentMethod} onChange={(event) => setPreferences((current) => ({ ...current, preferredPaymentMethod: event.target.value as BillingPreferences['preferredPaymentMethod'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="ACH">ACH</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Wire Transfer">Wire Transfer</option>
            </select>
          </label>
        </div>

        <button type="button" onClick={savePreferences} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Save Billing Preferences</button>
        {message ? <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}
        {error ? <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p> : null}
      </section>
    </div>
  );
}
