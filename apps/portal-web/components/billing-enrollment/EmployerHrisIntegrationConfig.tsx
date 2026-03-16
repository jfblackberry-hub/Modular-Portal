'use client';

import { useState } from 'react';

import type { HrisConnector } from '../../lib/hris-census-import-data';
import { StatusBadge } from '../portal-ui';

export function EmployerHrisIntegrationConfig({ connectors }: { connectors: HrisConnector[] }) {
  const [message, setMessage] = useState('');

  function saveConnector(provider: string) {
    setMessage(`${provider} connector settings saved (placeholder configuration).`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">HRIS &amp; Census Import</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Configure HRIS Integration
        </h1>
      </section>

      {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {connectors.map((connector) => (
          <article key={connector.id} className="portal-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{connector.provider}</h2>
              <StatusBadge label={connector.status} />
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{connector.notes}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Sync frequency: {connector.syncFrequency}</p>
            <p className="text-xs text-[var(--text-muted)]">Last sync: {connector.lastSyncDate ?? 'Never'}</p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                API Endpoint
                <input className="mt-1 h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder={`https://api.${connector.provider.toLowerCase().replaceAll(' ', '')}.example`} />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Client ID
                <input className="mt-1 h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="client-id" />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Secret (placeholder)
                <input type="password" className="mt-1 h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="••••••••" />
              </label>
            </div>

            <button type="button" onClick={() => saveConnector(connector.provider)} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
              Save Configuration
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
