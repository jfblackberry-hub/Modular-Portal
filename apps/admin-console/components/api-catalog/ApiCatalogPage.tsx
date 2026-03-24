'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { fetchAdminJsonCached } from '../../lib/admin-client-data';
import { apiBaseUrl, getAdminAuthHeaders } from '../../lib/api-auth';
import {
  type ApiCatalogCategory,
  type ApiCatalogEntry,
  getApiCatalogVendors,
  groupApiCatalogEntries,
  sortApiCatalogEntries} from '../../lib/api-catalog-api';
import { AdminErrorState, AdminLoadingState } from '../admin-ui';
import {
  type ApiMarketplaceFilters,
  ApiMarketplaceFiltersPanel} from './ApiMarketplaceFiltersPanel';
import { ApiMarketplaceGrid } from './ApiMarketplaceGrid';
import { ApiMarketplaceHeader } from './ApiMarketplaceHeader';
import { ApiMarketplaceTable } from './ApiMarketplaceTable';

const VIEW_MODE_STORAGE_KEY = 'admin-api-marketplace-view-mode';

type ViewMode = 'catalog' | 'table';

const DEFAULT_FILTERS: ApiMarketplaceFilters = {
  category: 'all',
  sort: 'featured',
  vendor: 'all'
};

function buildCategoryQuery(category: 'all' | ApiCatalogCategory) {
  return category === 'all' ? '' : `?category=${category}`;
}

export function ApiCatalogPage() {
  const [allEntries, setAllEntries] = useState<ApiCatalogEntry[]>([]);
  const [filters, setFilters] = useState<ApiMarketplaceFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const deferredSearch = useDeferredValue(search);

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

  useEffect(() => {
    let isCancelled = false;

    async function loadEntries() {
      setIsLoading(true);

      try {
        const payload = await fetchAdminJsonCached<ApiCatalogEntry[]>(
          `${apiBaseUrl}/api-catalog${buildCategoryQuery(filters.category)}`,
          {
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000,
            cacheKey: `api-catalog::${filters.category}`
          }
        );

        if (isCancelled) {
          return;
        }

        setAllEntries(payload);
        setError('');
      } catch (nextError) {
        if (isCancelled) {
          return;
        }

        setAllEntries([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load the API catalog.'
        );
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadEntries();

    return () => {
      isCancelled = true;
    };
  }, [filters.category]);

  const vendorOptions = useMemo(() => getApiCatalogVendors(allEntries), [allEntries]);

  const filteredEntries = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const searchedEntries = normalizedSearch
      ? allEntries.filter((entry) =>
          [
            entry.name,
            entry.vendor,
            entry.description,
            entry.endpoint,
            entry.version,
            entry.inputModels.join(' '),
            entry.outputModels.join(' ')
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        )
      : allEntries;

    const vendorEntries =
      filters.vendor === 'all'
        ? searchedEntries
        : searchedEntries.filter((entry) => entry.vendor === filters.vendor);

    return sortApiCatalogEntries(vendorEntries, filters.sort);
  }, [allEntries, deferredSearch, filters.sort, filters.vendor]);

  const groupedEntries = useMemo(
    () => groupApiCatalogEntries(filteredEntries),
    [filteredEntries]
  );
  const modelCount = filteredEntries.reduce(
    (total, entry) => total + entry.inputModels.length + entry.outputModels.length,
    0
  );
  const tenantScopedCount = filteredEntries.filter(
    (entry) => !entry.tenantAvailability.includes('*')
  ).length;

  return (
    <div className="space-y-6">
      <ApiMarketplaceHeader
        totalCount={filteredEntries.length}
        categoryCount={groupedEntries.length}
        tenantScopedCount={tenantScopedCount}
        modelCount={modelCount}
        search={search}
        onSearchChange={setSearch}
      />

      <section className="space-y-4">
        <ApiMarketplaceFiltersPanel
          filters={filters}
          onChange={setFilters}
          vendors={vendorOptions}
        />

        <section className="rounded-[1.6rem] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {filteredEntries.length} API{filteredEntries.length === 1 ? '' : 's'} in catalog
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Browse the backend-driven catalog with vendor, category, and schema metadata in a marketplace layout.
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
                    viewMode === mode ? 'bg-slate-950 text-white' : 'text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {isLoading ? (
          <AdminLoadingState
            title="Loading API catalog"
            description="Fetching live catalog entries and metadata from the backend service."
          />
        ) : error ? (
          <AdminErrorState
            title="Unable to load API catalog"
            description={error}
          />
        ) : viewMode === 'table' ? (
          <ApiMarketplaceTable groups={groupedEntries} />
        ) : (
          <ApiMarketplaceGrid groups={groupedEntries} />
        )}
      </section>
    </div>
  );
}
