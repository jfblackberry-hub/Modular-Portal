import Link from 'next/link';

import {
  type ApiCatalogEntry,
  formatApiCatalogCategory,
  formatTenantAvailability} from '../../lib/api-catalog-api';

type ApiMarketplaceCardProps = {
  entry: ApiCatalogEntry;
};

function ModelPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.68rem] font-medium text-slate-700">
      {label}
    </span>
  );
}

export function ApiMarketplaceCard({ entry }: ApiMarketplaceCardProps) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.11)]">
      <div className="h-1.5 bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_42%,#34d399_100%)]" />

      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {formatApiCatalogCategory(entry.category)}
            </p>
            <h3 className="mt-2 text-[1.05rem] font-semibold leading-6 tracking-[-0.025em] text-slate-950">
              {entry.name}
            </h3>
            <p className="mt-2 text-sm font-medium text-emerald-700">{entry.vendor}</p>
          </div>

          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[0.68rem] font-semibold text-white">
            {entry.version}
          </span>
        </div>

        <p className="text-[0.9rem] leading-6 text-slate-600">{entry.description}</p>

        <div className="grid gap-3">
          <div className="rounded-[1.15rem] bg-slate-50 px-3.5 py-3.5">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Endpoint
            </p>
            <p className="mt-1 break-all text-[0.82rem] font-semibold text-slate-900">
              {entry.endpoint}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.15rem] border border-slate-200 px-3.5 py-3.5">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Input models
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.inputModels.length === 0 ? (
                  <span className="text-xs text-slate-500">No input models listed</span>
                ) : (
                  entry.inputModels.slice(0, 3).map((model) => (
                    <ModelPill key={model} label={model} />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-slate-200 px-3.5 py-3.5">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Output models
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.outputModels.length === 0 ? (
                  <span className="text-xs text-slate-500">No output models listed</span>
                ) : (
                  entry.outputModels.slice(0, 3).map((model) => (
                    <ModelPill key={model} label={model} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200/90 pt-4">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Availability
            </p>
            <p className="mt-1 text-[0.8rem] font-semibold text-slate-900">
              {formatTenantAvailability(entry.tenantAvailability)}
            </p>
          </div>

          <Link
            href={`/admin/shared/api-catalog/${entry.slug}`}
            className="rounded-full bg-slate-950 px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-emerald-700"
          >
            View API
          </Link>
        </div>
      </div>
    </article>
  );
}
