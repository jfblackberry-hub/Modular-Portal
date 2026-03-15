import type { ProviderPortalConfig } from '../../../config/providerPortalConfig';

export function ProviderContextBar({ config }: { config: ProviderPortalConfig }) {
  const selectedLocation =
    config.providerContext.locations.find((location) => location.id === config.providerContext.selectedLocationId) ??
    config.providerContext.locations[0];

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Practice Name</p>
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{config.providerContext.practiceName}</p>
        </article>
        <article className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Provider Name</p>
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{config.providerContext.providerName}</p>
        </article>
        <article>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">NPI</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{config.providerContext.npi}</p>
        </article>
        <article>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">TIN</p>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{config.providerContext.tin}</p>
        </article>
        <article className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Active Location</p>
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{selectedLocation?.label ?? 'Not selected'}</p>
        </article>
      </div>
    </section>
  );
}
