import type {
  ApiMarketplaceFilterOptions,
  ApiMarketplaceFilters
} from '../../lib/api-marketplace.types';

type ApiMarketplaceFiltersPanelProps = {
  filters: ApiMarketplaceFilters;
  options: ApiMarketplaceFilterOptions;
  onChange: (next: ApiMarketplaceFilters) => void;
};

const SORTS = ['Most Relevant', 'Most Popular', 'Recently Updated', 'Alphabetical', 'Recommended'] as const;

export function ApiMarketplaceFiltersPanel({
  filters,
  options,
  onChange
}: ApiMarketplaceFiltersPanelProps) {
  return (
    <section className="rounded-[1.4rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Filters</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Narrow by category, audience, auth, sandbox access, and rollout status.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Category
          </span>
          <select
            value={filters.category}
            onChange={(event) =>
              onChange({ ...filters, category: event.target.value as ApiMarketplaceFilters['category'] })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All APIs">All categories</option>
            {options.categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            API type
          </span>
          <select
            value={filters.apiType}
            onChange={(event) => onChange({ ...filters, apiType: event.target.value as ApiMarketplaceFilters['apiType'] })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All API types</option>
            {options.apiTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Audience
          </span>
          <select
            value={filters.audience}
            onChange={(event) => onChange({ ...filters, audience: event.target.value as ApiMarketplaceFilters['audience'] })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All audiences</option>
            {options.audiences.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All statuses</option>
            {options.lifecycleStatuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Auth method
          </span>
          <select
            value={filters.authType}
            onChange={(event) => onChange({ ...filters, authType: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All auth methods</option>
            {options.authTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Publisher
          </span>
          <select
            value={filters.publisher}
            onChange={(event) => onChange({ ...filters, publisher: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">All publishers</option>
            {options.publishers.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Sandbox available
          </span>
          <select
            value={filters.sandbox}
            onChange={(event) => onChange({ ...filters, sandbox: event.target.value as ApiMarketplaceFilters['sandbox'] })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            <option value="All">Any sandbox posture</option>
            {options.sandboxValues.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Sort
          </span>
          <select
            value={filters.sort}
            onChange={(event) => onChange({ ...filters, sort: event.target.value as ApiMarketplaceFilters['sort'] })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
          >
            {SORTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
