import {
  AUTH_TYPES,
  AWS_RELEVANCE_OPTIONS,
  IMPLEMENTATION_STATUSES,
  STRATEGIC_PRIORITIES
} from '../../lib/api-catalog.constants';
import type { ApiCatalogFiltersState } from '../../lib/api-catalog.types';

type ApiCatalogFiltersDrawerProps = {
  isOpen: boolean;
  filters: ApiCatalogFiltersState;
  quickTags: string[];
  onChange: (next: ApiCatalogFiltersState) => void;
  onClose: () => void;
  onReset: () => void;
};

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function ApiCatalogFiltersDrawer({
  isOpen,
  filters,
  quickTags,
  onChange,
  onClose,
  onReset
}: ApiCatalogFiltersDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_34%,#f8fafc_100%)] px-6 py-6 shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              More Filters
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Refine the catalog by auth method, AWS relevance, tenant configurability, tags, and strategic priority.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h3 className="text-base font-semibold text-slate-950">Implementation state</h3>
            <div className="mt-4 space-y-3">
              {IMPLEMENTATION_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-3 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={filters.implementationStatuses.includes(status)}
                    onChange={() =>
                      onChange({
                        ...filters,
                        implementationStatuses: toggleValue(
                          filters.implementationStatuses,
                          status
                        )
                      })
                    }
                  />
                  {status}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h3 className="text-base font-semibold text-slate-950">Strategic priority</h3>
            <div className="mt-4 space-y-3">
              {STRATEGIC_PRIORITIES.map((priority) => (
                <label key={priority} className="flex items-center gap-3 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={filters.strategicPriorities.includes(priority)}
                    onChange={() =>
                      onChange({
                        ...filters,
                        strategicPriorities: toggleValue(
                          filters.strategicPriorities,
                          priority
                        )
                      })
                    }
                  />
                  {priority}
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <label className="block rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <span className="text-base font-semibold text-slate-950">Auth type</span>
              <select
                value={filters.authType}
                onChange={(event) =>
                  onChange({ ...filters, authType: event.target.value as typeof filters.authType })
                }
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
              >
                <option value="All">All auth types</option>
                {AUTH_TYPES.map((authType) => (
                  <option key={authType} value={authType}>
                    {authType}
                  </option>
                ))}
              </select>
            </label>

            <label className="block rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <span className="text-base font-semibold text-slate-950">AWS relevance</span>
              <select
                value={filters.awsRelevance}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    awsRelevance: event.target.value as typeof filters.awsRelevance
                  })
                }
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
              >
                <option value="All">All AWS relevance</option>
                {AWS_RELEVANCE_OPTIONS.map((relevance) => (
                  <option key={relevance} value={relevance}>
                    {relevance}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h3 className="text-base font-semibold text-slate-950">Tenant enablement</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {(['All', 'Yes', 'No'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ ...filters, tenantConfigurable: value })}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    filters.tenantConfigurable === value
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  {value === 'All' ? 'Any tenant model' : value === 'Yes' ? 'Tenant configurable' : 'Platform managed'}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h3 className="text-base font-semibold text-slate-950">Quick tags</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...filters, selectedTag: 'All' })}
                className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                  filters.selectedTag === 'All'
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                }`}
              >
                All
              </button>
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onChange({ ...filters, selectedTag: tag })}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                    filters.selectedTag === tag
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-900'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900"
          >
            Reset filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}
