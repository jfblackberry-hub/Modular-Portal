'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import {
  API_MARKETPLACE_CATALOG,
  DEFAULT_API_MARKETPLACE_FILTERS
} from '../../lib/api-marketplace.data';
import type { ApiMarketplaceFilters } from '../../lib/api-marketplace.types';
import {
  filterMarketplaceEntries,
  getFeaturedMarketplaceEntries,
  getMarketplaceAuthTypes,
  getMarketplaceCounts,
  getMarketplacePublishers,
  getPopularMarketplaceCategories
} from '../../lib/api-marketplace.utils';
import { ApiMarketplaceCategoryTabs } from './ApiMarketplaceCategoryTabs';
import { ApiMarketplaceFeaturedSection } from './ApiMarketplaceFeaturedSection';
import { ApiMarketplaceFiltersPanel } from './ApiMarketplaceFiltersPanel';
import { ApiMarketplaceGrid } from './ApiMarketplaceGrid';
import { ApiMarketplaceHeader } from './ApiMarketplaceHeader';
import { ApiMarketplaceTable } from './ApiMarketplaceTable';

const VIEW_MODE_STORAGE_KEY = 'admin-api-marketplace-view-mode';

type ViewMode = 'catalog' | 'table';

export function ApiCatalogPage() {
  const [filters, setFilters] = useState<ApiMarketplaceFilters>(DEFAULT_API_MARKETPLACE_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  const featuredEntries = useMemo(
    () => getFeaturedMarketplaceEntries(filteredEntries.length > 0 ? filteredEntries : API_MARKETPLACE_CATALOG),
    [filteredEntries]
  );
  const categoryCounts = useMemo(() => getMarketplaceCounts(API_MARKETPLACE_CATALOG), []);
  const publishers = useMemo(() => getMarketplacePublishers(API_MARKETPLACE_CATALOG), []);
  const authTypes = useMemo(() => getMarketplaceAuthTypes(API_MARKETPLACE_CATALOG), []);
  const popularCategories = useMemo(
    () => getPopularMarketplaceCategories(API_MARKETPLACE_CATALOG),
    []
  );

  const availableCount = API_MARKETPLACE_CATALOG.filter(
    (entry) => entry.lifecycleStatus === 'Available'
  ).length;
  const sandboxCount = API_MARKETPLACE_CATALOG.filter((entry) => entry.sandboxAvailable).length;

  return (
    <div className="space-y-7">
      <ApiMarketplaceHeader
        totalCount={API_MARKETPLACE_CATALOG.length}
        featuredCount={featuredEntries.length}
        availableCount={availableCount}
        sandboxCount={sandboxCount}
        search={filters.search}
        onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
      />

      <ApiMarketplaceCategoryTabs
        selectedCategory={filters.category}
        counts={categoryCounts}
        onSelect={(category) => setFilters((current) => ({ ...current, category }))}
      />

      <ApiMarketplaceFeaturedSection entries={featuredEntries} />

      <section className="grid gap-6 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="xl:hidden">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
            >
              Filters and sort
            </button>
          </div>

          <div className="hidden xl:block xl:sticky xl:top-6">
            <ApiMarketplaceFiltersPanel
              filters={filters}
              publishers={publishers}
              authTypes={authTypes}
              onChange={setFilters}
            />
          </div>

          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold text-slate-900">Popular categories</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {popularCategories.map(([category, count]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      category: category as ApiMarketplaceFilters['category']
                    }))
                  }
                  className="flex items-center justify-between rounded-[1.15rem] bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                >
                  <span className="text-sm font-semibold text-slate-900">{category}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {filteredEntries.length} API{filteredEntries.length === 1 ? '' : 's'} available
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Browse by category, compare readiness, and open individual APIs for integration details.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filters.publisher}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, publisher: event.target.value }))
                  }
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                >
                  <option value="All">All publishers</option>
                  {publishers.map((publisher) => (
                    <option key={publisher} value={publisher}>
                      {publisher}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.sort}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sort: event.target.value as ApiMarketplaceFilters['sort']
                    }))
                  }
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                >
                  {[
                    'Most Relevant',
                    'Most Popular',
                    'Recently Updated',
                    'Alphabetical',
                    'Recommended'
                  ].map((sort) => (
                    <option key={sort} value={sort}>
                      {sort}
                    </option>
                  ))}
                </select>

                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  {([
                    ['catalog', 'Catalog'],
                    ['table', 'Table']
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        viewMode === mode ? 'bg-slate-900 text-white' : 'text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {viewMode === 'table' ? (
            <ApiMarketplaceTable entries={filteredEntries} />
          ) : (
            <ApiMarketplaceGrid entries={filteredEntries} />
          )}
        </div>
      </section>

      {showMobileFilters ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm xl:hidden">
          <div className="absolute inset-y-0 left-0 w-full max-w-sm overflow-y-auto border-r border-slate-200 bg-[#f8fafc] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">Filters and sort</p>
                <p className="mt-1 text-sm text-slate-600">Refine the marketplace view.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Close
              </button>
            </div>

            <ApiMarketplaceFiltersPanel
              filters={filters}
              publishers={publishers}
              authTypes={authTypes}
              onChange={setFilters}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
