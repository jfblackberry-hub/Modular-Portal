import type {
  ApiCatalogFiltersState,
  ApiCatalogViewMode,
  ImplementationStatus
} from '../../lib/api-catalog.types';
import { API_CATALOG_SORT_OPTIONS, IMPLEMENTATION_STATUSES } from '../../lib/api-catalog.constants';

type ApiCatalogToolbarProps = {
  filters: ApiCatalogFiltersState;
  vendors: string[];
  onChange: (next: ApiCatalogFiltersState) => void;
  onOpenFilters: () => void;
  resultCount: number;
};

export function ApiCatalogToolbar({
  filters,
  vendors,
  onChange,
  onOpenFilters,
  resultCount
}: ApiCatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-4 px-1 py-1 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.vendor}
          onChange={(event) => onChange({ ...filters, vendor: event.target.value })}
          className="min-w-[11rem] rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.03)] outline-none transition focus:border-cyan-500"
        >
          <option value="All">All vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor} value={vendor}>
              {vendor}
            </option>
          ))}
        </select>

        <select
          value={filters.implementationStatuses[0] ?? 'All'}
          onChange={(event) =>
            onChange({
              ...filters,
              implementationStatuses:
                event.target.value === 'All'
                  ? []
                  : [event.target.value as ImplementationStatus]
            })
          }
          className="min-w-[11rem] rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.03)] outline-none transition focus:border-cyan-500"
        >
          <option value="All">All statuses</option>
          {IMPLEMENTATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.sortBy}
          onChange={(event) =>
            onChange({ ...filters, sortBy: event.target.value as typeof filters.sortBy })
          }
          className="min-w-[11rem] rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.03)] outline-none transition focus:border-cyan-500"
        >
          {API_CATALOG_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onOpenFilters}
          className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,23,42,0.12)] transition hover:bg-slate-900"
        >
          More filters
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-medium text-slate-500">
          {resultCount} result{resultCount === 1 ? '' : 's'}
        </p>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-[0_4px_14px_rgba(15,23,42,0.03)]">
          {[
            { value: 'grid', label: 'Catalog' },
            { value: 'table', label: 'Table' }
          ].map((mode) => {
            const selected = filters.viewMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    viewMode: mode.value as ApiCatalogViewMode
                  })
                }
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
