'use client';

import { useState } from 'react';

import type { IntegrationConfig } from '../../lib/employer-admin-settings-data';
import { StatusBadge } from '../portal-ui';

export function EmployerAdminIntegrationSettings({ integrations }: { integrations: IntegrationConfig[] }) {
  const [message, setMessage] = useState('');

  function saveIntegration(provider: string) {
    setMessage(`${provider} integration settings saved (placeholder action).`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Administration</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Integration Settings</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">Configure placeholders for HRIS, payroll, benefit administration, and third-party vendor connections.</p>
      </section>

      {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integration) => (
          <article key={integration.id} className="portal-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{integration.provider}</h2>
              <StatusBadge label={integration.status} />
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">{integration.category}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{integration.notes}</p>

            <div className="mt-4 space-y-2">
              <input className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Connection name" />
              <input className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Client ID" />
              <input type="password" className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Secret (placeholder)" />
            </div>

            <button type="button" onClick={() => saveIntegration(integration.provider)} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Save Integration Settings</button>
          </article>
        ))}
      </section>
    </div>
  );
}
