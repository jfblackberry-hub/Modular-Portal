'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { fetchAdminJsonCached } from '../../lib/admin-client-data';
import { apiBaseUrl, getAdminAuthHeaders } from '../../lib/api-auth';
import {
  API_CATALOG_CATEGORIES,
  type ApiCatalogCategory,
  type ApiCatalogEntry,
  getApiCatalogVendors,
  groupApiCatalogEntries,
  sortApiCatalogEntries} from '../../lib/api-catalog-api';
import { AdminErrorState, AdminLoadingState } from '../admin-ui';
import { SectionCard } from '../section-card';
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

type RegistryFormState = {
  id: string | null;
  slug: string;
  name: string;
  category: ApiCatalogCategory;
  vendor: string;
  description: string;
  endpoint: string;
  version: string;
  inputModels: string;
  outputModels: string;
  tenantAvailability: string;
  sortOrder: string;
};

const DEFAULT_FORM_STATE: RegistryFormState = {
  id: null,
  slug: '',
  name: '',
  category: 'claims',
  vendor: '',
  description: '',
  endpoint: '',
  version: 'v1',
  inputModels: '',
  outputModels: '',
  tenantAvailability: '*',
  sortOrder: '0'
};

function toCommaSeparated(value: string[]) {
  return value.join(', ');
}

function buildFormState(entry: ApiCatalogEntry): RegistryFormState {
  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    category: entry.category,
    vendor: entry.vendor,
    description: entry.description,
    endpoint: entry.endpoint,
    version: entry.version,
    inputModels: toCommaSeparated(entry.inputModels),
    outputModels: toCommaSeparated(entry.outputModels),
    tenantAvailability: toCommaSeparated(entry.tenantAvailability),
    sortOrder: '0'
  };
}

function parseCommaSeparated(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildCategoryQuery(category: 'all' | ApiCatalogCategory) {
  return category === 'all' ? '' : `?category=${category}`;
}

export function ApiCatalogPage() {
  const [allEntries, setAllEntries] = useState<ApiCatalogEntry[]>([]);
  const [filters, setFilters] = useState<ApiMarketplaceFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formState, setFormState] = useState<RegistryFormState>(DEFAULT_FORM_STATE);
  const deferredSearch = useDeferredValue(search);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);

    try {
      const payload = await fetchAdminJsonCached<ApiCatalogEntry[]>(
        `${apiBaseUrl}/api-catalog${buildCategoryQuery(filters.category)}`,
        {
          cacheContext: { scope: 'platform' },
          headers: getAdminAuthHeaders(),
          ttlMs: 20_000,
          resourceDiscriminator: `api-catalog::${filters.category}`
        }
      );

      setAllEntries(payload);
      setError('');
    } catch (nextError) {
      setAllEntries([]);
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load the API catalog.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters.category]);

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

    void (async () => {
      await loadEntries();
      if (isCancelled) {
        return;
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [loadEntries]);

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

  function resetForm() {
    setFormState(DEFAULT_FORM_STATE);
    setSaveError('');
    setSaveSuccess('');
  }

  async function handleRegistrySave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        slug: formState.slug.trim(),
        name: formState.name.trim(),
        category: formState.category,
        vendor: formState.vendor.trim(),
        description: formState.description.trim(),
        endpoint: formState.endpoint.trim(),
        version: formState.version.trim(),
        inputModels: parseCommaSeparated(formState.inputModels),
        outputModels: parseCommaSeparated(formState.outputModels),
        tenantAvailability: parseCommaSeparated(formState.tenantAvailability),
        sortOrder: Number.parseInt(formState.sortOrder, 10) || 0
      };

      const isEditing = Boolean(formState.id);
      const response = await fetch(
        formState.id
          ? `${apiBaseUrl}/platform-admin/connectivity/api-catalog/${formState.id}`
          : `${apiBaseUrl}/platform-admin/connectivity/api-catalog`,
        {
          method: formState.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const nextPayload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(nextPayload?.message ?? 'Unable to save registry entry.');
      }

      setSaveSuccess(isEditing ? 'Registry entry updated.' : 'Registry entry created.');
      resetForm();
      await loadEntries();
    } catch (nextError) {
      setSaveError(
        nextError instanceof Error ? nextError.message : 'Unable to save registry entry.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegistryDelete() {
    if (!formState.id) {
      return;
    }

    setIsDeleting(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/platform-admin/connectivity/api-catalog/${formState.id}`,
        {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        }
      );

      if (!response.ok) {
        const nextPayload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(nextPayload?.message ?? 'Unable to delete registry entry.');
      }

      setSaveSuccess('Registry entry deleted.');
      resetForm();
      await loadEntries();
    } catch (nextError) {
      setSaveError(
        nextError instanceof Error ? nextError.message : 'Unable to delete registry entry.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

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

      <SectionCard
        title="Integration Registry Management"
        description="Manage the platform's upstream API registry so admins can track which external systems and data contracts the portal depends on."
      >
        <form className="space-y-5" onSubmit={handleRegistrySave}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-admin-text">Name</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Epic FHIR Eligibility"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Vendor</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.vendor}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, vendor: event.target.value }))
                }
                placeholder="Epic"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Slug</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.slug}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, slug: event.target.value }))
                }
                placeholder="epic-fhir-eligibility"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Category</span>
              <select
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.category}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    category: event.target.value as ApiCatalogCategory
                  }))
                }
              >
                {API_CATALOG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Endpoint</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.endpoint}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, endpoint: event.target.value }))
                }
                placeholder="/fhir/R4/Patient"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Version</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.version}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, version: event.target.value }))
                }
                placeholder="v1"
                required
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="text-sm font-medium text-admin-text">Description</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Describe the upstream system, contract, and the data this portal consumes."
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Input Models</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.inputModels}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, inputModels: event.target.value }))
                }
                placeholder="CoverageRequest, MemberLookup"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Output Models</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.outputModels}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, outputModels: event.target.value }))
                }
                placeholder="EligibilityResponse, ClaimSummary"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Tenant Availability</span>
              <input
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.tenantAvailability}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    tenantAvailability: event.target.value
                  }))
                }
                placeholder="*"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-admin-text">Sort Order</span>
              <input
                type="number"
                className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
            </label>
          </div>

          {saveError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {saveError}
            </p>
          ) : null}
          {saveSuccess ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saveSuccess}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving registry entry...' : formState.id ? 'Update registry entry' : 'Create registry entry'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-admin-border bg-white px-5 py-3 text-sm font-semibold text-admin-text"
            >
              Clear form
            </button>
            {formState.id ? (
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleRegistryDelete()}
                className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete entry'}
              </button>
            ) : null}
          </div>
        </form>
      </SectionCard>

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

        <SectionCard
          title="Registry Entries"
          description="Click an entry to load it into the management form for editing."
        >
          {filteredEntries.length === 0 ? (
            <p className="text-sm text-admin-muted">No registry entries match the current filters.</p>
          ) : (
            <div className="grid gap-3">
              {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setFormState(buildFormState(entry));
                    setSaveError('');
                    setSaveSuccess('');
                  }}
                  className="rounded-2xl border border-admin-border bg-white px-4 py-4 text-left transition hover:border-admin-accent hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-admin-text">{entry.name}</p>
                      <p className="mt-1 text-sm text-admin-muted">
                        {entry.vendor} · {entry.category} · {entry.version}
                      </p>
                    </div>
                    <span className="rounded-full border border-admin-border bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-admin-text">
                      {entry.slug}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-admin-muted">{entry.description}</p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

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
