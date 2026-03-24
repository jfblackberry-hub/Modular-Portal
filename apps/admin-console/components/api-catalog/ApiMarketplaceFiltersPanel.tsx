import {
  API_CATALOG_CATEGORIES,
  type ApiCatalogSort,
  formatApiCatalogCategory} from '../../lib/api-catalog-api';

type ApiMarketplaceFilters = {
  category: 'all' | (typeof API_CATALOG_CATEGORIES)[number];
  sort: ApiCatalogSort;
  vendor: 'all' | string;
};

type ApiMarketplaceFiltersPanelProps = {
  filters: ApiMarketplaceFilters;
  onChange: (next: ApiMarketplaceFilters) => void;
  vendors: string[];
};

const SORT_OPTIONS: Array<{
  label: string;
  value: ApiCatalogSort;
}> = [
  { label: 'Featured', value: 'featured' },
  { label: 'Name (A-Z)', value: 'name-asc' },
  { label: 'Name (Z-A)', value: 'name-desc' },
  { label: 'Vendor', value: 'vendor-asc' },
  { label: 'Version', value: 'version-desc' }
];

export function ApiMarketplaceFiltersPanel({
  filters,
  onChange,
  vendors
}: ApiMarketplaceFiltersPanelProps) {
  return (
    <section className="rounded-[1.6rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Browse filters</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Narrow the catalog by integration category and vendor, then sort for discovery.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange({
              category: 'all',
              sort: 'featured',
              vendor: 'all'
            })
          }
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Reset filters
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.9fr)_minmax(12rem,0.9fr)]">
        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Category
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...filters, category: 'all' })}
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                filters.category === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              All
            </button>
            {API_CATALOG_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onChange({ ...filters, category })}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                  filters.category === category
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {formatApiCatalogCategory(category)}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Vendor
          </span>
          <select
            value={filters.vendor}
            onChange={(event) =>
              onChange({
                ...filters,
                vendor: event.target.value
              })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          >
            <option value="all">All vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
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
            onChange={(event) =>
              onChange({
                ...filters,
                sort: event.target.value as ApiCatalogSort
              })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

export type { ApiMarketplaceFilters };
