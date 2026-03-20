import type { ApiCatalogEntry } from '../../lib/api-catalog.types';
import {
  getCategoryTone,
  getImplementationTone,
  getPriorityTone
} from '../../lib/api-catalog.utils';

type ApiCatalogCardProps = {
  entry: ApiCatalogEntry;
  onSelect: (entry: ApiCatalogEntry) => void;
};

export function ApiCatalogCard({ entry, onSelect }: ApiCatalogCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.10),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_28px_58px_rgba(8,145,178,0.14)]">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#0f172a_0%,#0891b2_45%,#67e8f9_100%)] opacity-85" />
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryTone(
            entry.apiCategory
          )}`}
        >
          {entry.apiCategory}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getImplementationTone(
            entry.implementationStatus
          )}`}
        >
          {entry.implementationStatus}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityTone(
            entry.strategicPriority
          )}`}
        >
          {entry.strategicPriority}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[1.35rem] font-semibold tracking-[-0.035em] text-slate-950">
          {entry.vendorName} · {entry.platformName}
        </p>
        <h3 className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
          {entry.apiName}
        </h3>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">{entry.summary}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] bg-slate-50 px-3 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Auth
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {entry.authTypes.slice(0, 2).join(' • ')}
          </p>
        </div>
        <div className="rounded-[1.2rem] bg-slate-50 px-3 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Integration Style
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {entry.integrationPatterns.slice(0, 2).join(' • ')}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Primary use</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {entry.supportedModules.slice(0, 2).join(' • ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition group-hover:border-cyan-400 group-hover:bg-slate-950 group-hover:text-white"
        >
          View details
        </button>
      </div>
    </article>
  );
}
