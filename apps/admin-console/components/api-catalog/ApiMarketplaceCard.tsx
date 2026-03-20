import Link from 'next/link';

import type { ApiMarketplaceEntry } from '../../lib/api-marketplace.types';

type ApiMarketplaceCardProps = {
  entry: ApiMarketplaceEntry;
  featured?: boolean;
};

function badgeTone(label: string) {
  if (label === 'Available') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (label === 'Beta') {
    return 'bg-sky-50 text-sky-700';
  }

  if (label === 'Planned') {
    return 'bg-amber-50 text-amber-700';
  }

  if (label === 'Restricted') {
    return 'bg-rose-50 text-rose-700';
  }

  return 'bg-slate-100 text-slate-700';
}

function iconGradient(iconKey: string) {
  const palette = [
    'from-sky-500 to-cyan-400',
    'from-indigo-500 to-sky-500',
    'from-emerald-500 to-cyan-500',
    'from-violet-500 to-indigo-500',
    'from-rose-500 to-orange-400'
  ];
  let hash = 0;
  for (const char of iconKey) {
    hash += char.charCodeAt(0);
  }

  return palette[hash % palette.length];
}

export function ApiMarketplaceCard({ entry, featured = false }: ApiMarketplaceCardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] ${
        featured ? 'bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]' : ''
      }`}
    >
      {featured ? (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#0f172a_0%,#0ea5e9_55%,#67e8f9_100%)]" />
      ) : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br ${iconGradient(
                entry.iconKey
              )} text-xs font-semibold text-white shadow-[0_8px_18px_rgba(14,165,233,0.18)]`}
            >
              {entry.publisher.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.74rem] font-medium text-slate-500">{entry.publisher}</p>
              <p className="truncate text-[0.82rem] font-semibold text-slate-900">{entry.platformName}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${badgeTone(entry.lifecycleStatus)}`}>
            {entry.lifecycleStatus}
          </span>
        </div>

        <div className="mt-4">
          <h3 className="line-clamp-2 text-[1rem] font-semibold leading-6 tracking-[-0.025em] text-slate-950">
            {entry.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-5 text-slate-600">
            {entry.shortDescription}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[entry.category, entry.apiType, entry.sandboxAvailable ? 'Sandbox' : 'No sandbox']
            .filter(Boolean)
            .slice(0, 3)
            .map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-medium text-slate-700"
              >
                {item}
              </span>
            ))}
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Auth
            </p>
            <p className="mt-1 text-[0.8rem] font-semibold text-slate-900">
              {entry.authType}
            </p>
          </div>
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Updated
            </p>
            <p className="mt-1 text-[0.8rem] font-semibold text-slate-900">{entry.lastUpdated}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/90 pt-3">
          <div className="min-w-0">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Style
            </p>
            <p className="truncate text-[0.8rem] font-semibold text-slate-900">{entry.integrationStyle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:inline">
              {entry.version}
            </span>
            <Link
              href={`/admin/platform/connectivity/catalog/${entry.slug}`}
              className="rounded-full bg-slate-950 px-3.5 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-sky-700"
            >
              View API
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
