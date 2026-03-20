import type { ApiMarketplaceFilters } from '../../lib/api-marketplace.types';

type ApiMarketplaceFiltersPanelProps = {
  filters: ApiMarketplaceFilters;
  publishers: string[];
  authTypes: string[];
  onChange: (next: ApiMarketplaceFilters) => void;
};

const API_TYPES = ['All', 'REST', 'FHIR', 'Batch', 'Event', 'EDI', 'Internal', 'External'] as const;
const AUDIENCES = ['All', 'Internal', 'Partner', 'Customer', 'Vendor'] as const;
const STATUSES = ['All', 'Available', 'Beta', 'Planned', 'Restricted'] as const;
const SANDBOX = ['All', 'Yes', 'No'] as const;
const SORTS = ['Most Relevant', 'Most Popular', 'Recently Updated', 'Alphabetical', 'Recommended'] as const;

export function ApiMarketplaceFiltersPanel({
  filters,
  publishers,
  authTypes,
  onChange
}: ApiMarketplaceFiltersPanelProps) {
  return (
    <aside className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
      <div>
        <p className="text-sm font-semibold text-slate-900">Filter catalog</p>
        <p className="mt-1 text-sm text-slate-600">
          Narrow by audience, auth, sandbox access, and rollout status.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            API type
          </span>
          <select
            value={filters.apiType}
            onChange={(event) => onChange({ ...filters, apiType: event.target.value as ApiMarketplaceFilters['apiType'] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            {API_TYPES.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All API types' : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Audience
          </span>
          <select
            value={filters.audience}
            onChange={(event) => onChange({ ...filters, audience: event.target.value as ApiMarketplaceFilters['audience'] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            {AUDIENCES.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All audiences' : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Status
          </span>
          <select
            value={filters.lifecycleStatus}
            onChange={(event) =>
              onChange({
                ...filters,
                lifecycleStatus: event.target.value as ApiMarketplaceFilters['lifecycleStatus']
              })
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Auth method
          </span>
          <select
            value={filters.authType}
            onChange={(event) => onChange({ ...filters, authType: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All auth methods</option>
            {authTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Publisher
          </span>
          <select
            value={filters.publisher}
            onChange={(event) => onChange({ ...filters, publisher: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All publishers</option>
            {publishers.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Sandbox available
          </span>
          <select
            value={filters.sandbox}
            onChange={(event) => onChange({ ...filters, sandbox: event.target.value as ApiMarketplaceFilters['sandbox'] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            {SANDBOX.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'Any sandbox posture' : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Sort
          </span>
          <select
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as ApiMarketplaceFilters['sort'] })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            {SORTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  );
}
