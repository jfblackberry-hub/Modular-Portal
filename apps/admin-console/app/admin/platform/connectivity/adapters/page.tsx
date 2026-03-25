'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PlatformAdminGate } from '../../../../../components/platform-admin-gate';
import { SectionCard } from '../../../../../components/section-card';
import { fetchAdminJsonCached } from '../../../../../lib/admin-client-data';
import { config, getAdminAuthHeaders } from '../../../../../lib/api-auth';
import { type ApiCatalogEntry } from '../../../../../lib/api-catalog-api';

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type AdapterRow = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  adapterKey: string;
  status: string;
  catalogEntryKey: string | null;
  catalogLabel: string | null;
  catalogVendor: string | null;
  catalogCategory: string | null;
  endpoint: string;
  mapping: string;
  lastSyncAt: string | null;
};

function formatTimestamp(value: string | null) {
  return value ? new Date(value).toLocaleString() : 'None recorded';
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes('active') ||
    normalized.includes('connected') ||
    normalized.includes('healthy')
  ) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (
    normalized.includes('warning') ||
    normalized.includes('configured') ||
    normalized.includes('disabled')
  ) {
    return 'bg-amber-100 text-amber-700';
  }

  return 'bg-rose-100 text-rose-700';
}

function getInitialFieldValues(entry: ApiCatalogEntry | undefined): Record<string, string> {
  if (!entry) {
    return {};
  }

  return {
    baseUrl: '',
    endpointPath: entry.endpoint,
    method: 'GET',
    authenticationType: 'none',
    apiKeyHeaderName: 'x-api-key',
    mappingKey: entry.slug
  };
}

export default function AdminPlatformAdapterStatusPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rows, setRows] = useState<AdapterRow[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<ApiCatalogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedCatalogEntryId, setSelectedCatalogEntryId] = useState('');
  const [catalogName, setCatalogName] = useState('');
  const [catalogStatus, setCatalogStatus] = useState('ACTIVE');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  async function loadWorkspace() {
    setIsLoading(true);

    try {
      const [inventory, catalog] = await Promise.all([
        fetchAdminJsonCached<{
          tenants: Tenant[];
          rows: AdapterRow[];
        }>(`${config.apiBaseUrl}/platform-admin/connectivity/adapter-inventory`, {
          headers: getAdminAuthHeaders(),
          ttlMs: 20_000
        }),
        fetchAdminJsonCached<ApiCatalogEntry[]>(`${config.apiBaseUrl}/api-catalog`, {
          headers: getAdminAuthHeaders(),
          ttlMs: 20_000
        })
      ]);

      setTenants(inventory.tenants);
      setRows(inventory.rows);
      setCatalogEntries(catalog);
      setSelectedTenantId((current) => current || inventory.tenants[0]?.id || '');
      setSelectedCatalogEntryId((current) => current || catalog[0]?.id || '');
      setError('');
    } catch (nextError) {
      setRows([]);
      setCatalogEntries([]);
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to load platform adapter inventory.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, []);

  const selectedCatalogEntry = useMemo(
    () => catalogEntries.find((entry) => entry.id === selectedCatalogEntryId),
    [catalogEntries, selectedCatalogEntryId]
  );

  useEffect(() => {
    if (!selectedCatalogEntry) {
      return;
    }

    setCatalogName(selectedCatalogEntry.name);
    setFieldValues(getInitialFieldValues(selectedCatalogEntry));
  }, [selectedCatalogEntry]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.tenantName,
        row.name,
        row.adapterKey,
        row.catalogLabel ?? '',
        row.catalogVendor ?? '',
        row.endpoint,
        row.mapping
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [rows, search]);

  const catalogConnectorCount = rows.filter((row) => Boolean(row.catalogEntryKey)).length;
  const customConnectorCount = rows.length - catalogConnectorCount;
  const tenantsUsingCatalog = new Set(
    rows.filter((row) => row.catalogEntryKey).map((row) => row.tenantId)
  ).size;
  const authenticationType = fieldValues.authenticationType ?? 'none';

  async function handleApplyCatalog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTenantId || !selectedCatalogEntry) {
      return;
    }

    setIsApplying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/connectivity/api-catalog/apply-registry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            tenantId: selectedTenantId,
            entryId: selectedCatalogEntry.id,
            name: catalogName,
            status: catalogStatus,
            baseUrl: fieldValues.baseUrl,
            endpointPath: fieldValues.endpointPath,
            method: fieldValues.method,
            authenticationType,
            authToken: fieldValues.authToken,
            apiKeyHeaderName: fieldValues.apiKeyHeaderName,
            apiKeyValue: fieldValues.apiKeyValue,
            basicUsername: fieldValues.basicUsername,
            basicPassword: fieldValues.basicPassword,
            mappingKey: fieldValues.mappingKey
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? 'Unable to apply catalog API to tenant.');
      }

      const tenantName =
        tenants.find((tenant) => tenant.id === selectedTenantId)?.name ?? 'tenant';
      setSuccess(`Applied ${selectedCatalogEntry.name} to ${tenantName}.`);
      await loadWorkspace();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to apply registry entry to tenant.'
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <PlatformAdminGate>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-admin-accent">
            Platform
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-admin-text">
            Applied APIs / Adapter Status
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-admin-muted">
            Apply vetted connector templates to tenants, manage cross-tenant deployments, and monitor which configured integrations are healthy or need follow-up.
          </p>
        </div>

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Registry entries', value: String(catalogEntries.length) },
            { label: 'Catalog deployments', value: String(catalogConnectorCount) },
            { label: 'Tenants using catalog', value: String(tenantsUsingCatalog) },
            { label: 'Custom connectors', value: String(customConnectorCount) }
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-admin-border bg-admin-panel px-5 py-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-admin-muted">
                {item.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-admin-text">
                {isLoading ? '--' : item.value}
              </p>
            </div>
          ))}
        </div>

        <SectionCard
          title="Integration registry"
          description="Persistent upstream API registry entries that can be applied to any tenant instead of hand-building every connector from scratch."
        >
          <div className="mb-4 flex justify-end">
            <Link
              href="/admin/platform/connectivity/catalog"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-admin-border bg-white px-5 py-3 text-sm font-semibold text-admin-text"
            >
              Open strategic API catalog
            </Link>
          </div>
          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading registry entries...</p>
          ) : catalogEntries.length === 0 ? (
            <p className="text-sm text-admin-muted">No registry entries are registered yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {catalogEntries.map((entry) => {
                const deployments = rows.filter((row) => row.catalogEntryKey === entry.slug);
                const tenantCount = new Set(deployments.map((row) => row.tenantId)).size;

                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-admin-text">{entry.name}</p>
                        <p className="mt-1 text-sm text-admin-muted">
                          {entry.vendor} · {entry.category}
                        </p>
                      </div>
                      <span className="rounded-full border border-admin-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-admin-text">
                        {entry.version}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-admin-muted">{entry.description}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-admin-border bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                          Deployments
                        </p>
                        <p className="mt-2 text-lg font-semibold text-admin-text">
                          {deployments.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-admin-border bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-muted">
                          Tenants
                        </p>
                        <p className="mt-2 text-lg font-semibold text-admin-text">
                          {tenantCount}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Apply registry entry to tenant"
          description="Select a tenant, choose a registry entry, and configure the runtime endpoint details so the connector is immediately usable."
        >
          <form className="space-y-5" onSubmit={handleApplyCatalog}>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-admin-text">Tenant</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select tenant
                  </option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-admin-text">Registry entry</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                  value={selectedCatalogEntryId}
                  onChange={(event) => setSelectedCatalogEntryId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select registry entry
                  </option>
                  {catalogEntries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} ({entry.vendor})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedCatalogEntry ? (
              <>
                <div className="rounded-2xl border border-admin-border bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-admin-text">{selectedCatalogEntry.name}</p>
                  <p className="mt-1 text-sm text-admin-muted">
                    {selectedCatalogEntry.description}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)]">
                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Connection name</span>
                    <input
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={catalogName}
                      onChange={(event) => setCatalogName(event.target.value)}
                      placeholder={selectedCatalogEntry.name}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Status</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={catalogStatus}
                      onChange={(event) => setCatalogStatus(event.target.value)}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="DISABLED">Disabled</option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Base URL</span>
                    <input
                      type="url"
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={fieldValues.baseUrl ?? ''}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          baseUrl: event.target.value
                        }))
                      }
                      placeholder="https://vendor.example.com"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Endpoint Path</span>
                    <input
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={fieldValues.endpointPath ?? ''}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          endpointPath: event.target.value
                        }))
                      }
                      placeholder={selectedCatalogEntry.endpoint}
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Method</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={fieldValues.method ?? 'GET'}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          method: event.target.value
                        }))
                      }
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Mapping Key</span>
                    <input
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={fieldValues.mappingKey ?? ''}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          mappingKey: event.target.value
                        }))
                      }
                      placeholder={selectedCatalogEntry.slug}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-admin-text">Authentication</span>
                    <select
                      className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                      value={authenticationType}
                      onChange={(event) =>
                        setFieldValues((current) => ({
                          ...current,
                          authenticationType: event.target.value
                        }))
                      }
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer token</option>
                      <option value="apiKey">API key</option>
                      <option value="basic">Basic auth</option>
                    </select>
                  </label>

                  {authenticationType === 'bearer' ? (
                    <label className="block">
                      <span className="text-sm font-medium text-admin-text">Bearer Token</span>
                      <input
                        type="password"
                        className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                        value={fieldValues.authToken ?? ''}
                        onChange={(event) =>
                          setFieldValues((current) => ({
                            ...current,
                            authToken: event.target.value
                          }))
                        }
                      />
                    </label>
                  ) : null}

                  {authenticationType === 'apiKey' ? (
                    <>
                      <label className="block">
                        <span className="text-sm font-medium text-admin-text">API Key Header</span>
                        <input
                          className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={fieldValues.apiKeyHeaderName ?? 'x-api-key'}
                          onChange={(event) =>
                            setFieldValues((current) => ({
                              ...current,
                              apiKeyHeaderName: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-admin-text">API Key</span>
                        <input
                          type="password"
                          className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={fieldValues.apiKeyValue ?? ''}
                          onChange={(event) =>
                            setFieldValues((current) => ({
                              ...current,
                              apiKeyValue: event.target.value
                            }))
                          }
                        />
                      </label>
                    </>
                  ) : null}

                  {authenticationType === 'basic' ? (
                    <>
                      <label className="block">
                        <span className="text-sm font-medium text-admin-text">Username</span>
                        <input
                          className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={fieldValues.basicUsername ?? ''}
                          onChange={(event) =>
                            setFieldValues((current) => ({
                              ...current,
                              basicUsername: event.target.value
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-admin-text">Password</span>
                        <input
                          type="password"
                          className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
                          value={fieldValues.basicPassword ?? ''}
                          onChange={(event) =>
                            setFieldValues((current) => ({
                              ...current,
                              basicPassword: event.target.value
                            }))
                          }
                        />
                      </label>
                    </>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isApplying ? 'Applying registry entry...' : 'Apply registry entry'}
                  </button>
                  {selectedTenantId ? (
                    <Link
                      href={`/admin/tenant/configuration?tenantId=${selectedTenantId}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-admin-border bg-white px-5 py-3 text-sm font-semibold text-admin-text"
                    >
                      Open tenant configuration
                    </Link>
                  ) : null}
                </div>
              </>
            ) : null}
          </form>
        </SectionCard>

        <SectionCard
          title="Configured provider and platform APIs"
          description="Cross-tenant inventory of live connectors, with catalog-backed entries clearly identified so support teams can see what was applied from the shared library."
        >
          <div className="mb-5">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenant, connector, template, vendor, endpoint, or mapping"
              className="w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-admin-muted">Loading adapter inventory...</p>
          ) : filteredRows.length === 0 ? (
            <p className="text-sm text-admin-muted">No adapters match the current search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-admin-border text-xs uppercase tracking-[0.2em] text-admin-muted">
                  <tr>
                    <th className="px-3 py-3">Tenant</th>
                    <th className="px-3 py-3">Connector</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Endpoint</th>
                    <th className="px-3 py-3">Mapping</th>
                    <th className="px-3 py-3">Last activity</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-b border-admin-border/70 align-top">
                      <td className="px-3 py-4 text-admin-text">{row.tenantName}</td>
                      <td className="px-3 py-4 font-medium text-admin-text">{row.name}</td>
                      <td className="px-3 py-4 text-admin-muted">
                        {row.catalogLabel ? (
                          <div>
                            <p className="font-medium text-admin-text">{row.catalogLabel}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-admin-muted">
                              {row.catalogVendor ?? 'Catalog'}
                            </p>
                          </div>
                        ) : (
                          'Custom connector'
                        )}
                      </td>
                      <td className="px-3 py-4 text-admin-muted">{row.adapterKey}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusTone(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-admin-muted">{row.endpoint}</td>
                      <td className="px-3 py-4 text-admin-muted">{row.mapping}</td>
                      <td className="px-3 py-4 text-admin-muted">{formatTimestamp(row.lastSyncAt)}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/admin/tenant/configuration?tenantId=${row.tenantId}`}
                            className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
                          >
                            Manage endpoint
                          </Link>
                          <Link
                            href={`/admin/platform/tenants/${row.tenantId}`}
                            className="text-xs font-semibold uppercase tracking-[0.18em] text-admin-accent underline-offset-4 hover:underline"
                          >
                            Open tenant detail
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </PlatformAdminGate>
  );
}
