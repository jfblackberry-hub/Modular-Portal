'use client';

import { useState } from 'react';

import type { EmployerProfile } from '../../lib/employer-admin-settings-data';

export function EmployerProfileSettings({ initialProfile }: { initialProfile: EmployerProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function saveProfile() {
    setMessage('');
    setError('');

    if (!profile.primaryContactEmail.includes('@')) {
      setError('Invalid contact information: primary contact email is invalid.');
      return;
    }

    if (!profile.billingAddress.trim()) {
      setError('Missing billing contact: billing address is required.');
      return;
    }

    setMessage('Employer profile updated (mock action with audit logging).');
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Administration</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Employer Profile</h1>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Employer Name</span>
            <input value={profile.employerName} onChange={(event) => setProfile((current) => ({ ...current, employerName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Employer ID</span>
            <input value={profile.employerId} onChange={(event) => setProfile((current) => ({ ...current, employerId: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Primary Contact Name</span>
            <input value={profile.primaryContactName} onChange={(event) => setProfile((current) => ({ ...current, primaryContactName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Primary Contact Email</span>
            <input value={profile.primaryContactEmail} onChange={(event) => setProfile((current) => ({ ...current, primaryContactEmail: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Primary Contact Phone</span>
            <input value={profile.primaryContactPhone} onChange={(event) => setProfile((current) => ({ ...current, primaryContactPhone: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Billing Address</span>
            <input value={profile.billingAddress} onChange={(event) => setProfile((current) => ({ ...current, billingAddress: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Headquarters Address</span>
            <input value={profile.headquartersAddress} onChange={(event) => setProfile((current) => ({ ...current, headquartersAddress: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Plan Year Start</span>
            <input type="date" value={profile.planYearStart} onChange={(event) => setProfile((current) => ({ ...current, planYearStart: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Plan Year End</span>
            <input type="date" value={profile.planYearEnd} onChange={(event) => setProfile((current) => ({ ...current, planYearEnd: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
        </div>

        <button type="button" onClick={saveProfile} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">Save Profile</button>
        {message ? <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}
        {error ? <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p> : null}
      </section>
    </div>
  );
}
