'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import {
  API_MARKETPLACE_CATALOG,
  DEFAULT_API_MARKETPLACE_FILTERS
} from '../../lib/api-marketplace.data';
import type { ApiMarketplaceFilters } from '../../lib/api-marketplace.types';
import {
  filterMarketplaceEntries,
  getMarketplaceFilterOptions
} from '../../lib/api-marketplace.utils';
import { ApiMarketplaceFiltersPanel } from './ApiMarketplaceFiltersPanel';
import { ApiMarketplaceGrid } from './ApiMarketplaceGrid';
import { ApiMarketplaceHeader } from './ApiMarketplaceHeader';
import { ApiMarketplaceTable } from './ApiMarketplaceTable';

const VIEW_MODE_STORAGE_KEY = 'admin-api-marketplace-view-mode';

type ViewMode = 'catalog' | 'table';

export function ApiCatalogPage() {
  const [filters, setFilters] = useState<ApiMarketplaceFilters>(DEFAULT_API_MARKETPLACE_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (storedMode === 'catalog' || storedMode === 'table') {
      setViewMode(storedMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const appliedFilters = useMemo(
    () => ({
      ...filters,
      search: deferredSearch
    }),
    [deferredSearch, filters]
  );

  const filteredEntries = useMemo(
    () => filterMarketplaceEntries(API_MARKETPLACE_CATALOG, appliedFilters),
    [appliedFilters]
  );
  const filterOptions = useMemo(
    () => getMarketplaceFilterOptions(API_MARKETPLACE_CATALOG, appliedFilters),
    [appliedFilters]
  );
  const availableCount = API_MARKETPLACE_CATALOG.filter(
    (entry) => entry.lifecycleStatus === 'Available'
  ).length;
  const sandboxCount = API_MARKETPLACE_CATALOG.filter((entry) => entry.sandboxAvailable).length;

  return (
    <div className="space-y-6">
      <ApiMarketplaceHeader
        totalCount={API_MARKETPLACE_CATALOG.length}
        availableCount={availableCount}
        sandboxCount={sandboxCount}
        search={filters.search}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
      />

      <section className="space-y-4">
        <ApiMarketplaceFiltersPanel
          filters={filters}
          options={filterOptions}
          onChange={setFilters}
        />

        <section className="rounded-[1.4rem] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {filteredEntries.length} API{filteredEntries.length === 1 ? '' : 's'} available
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Filter the catalog and open individual APIs for deeper integration details.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
              {([
                ['catalog', 'Catalog'],
                ['table', 'Table']
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    viewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {viewMode === 'table' ? (
          <ApiMarketplaceTable entries={filteredEntries} />
        ) : (
          <ApiMarketplaceGrid entries={filteredEntries} />
        )}
      </section>
    </div>
  );
}
