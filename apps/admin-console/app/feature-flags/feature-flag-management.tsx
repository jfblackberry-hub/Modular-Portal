'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { SectionCard } from '../../components/section-card';
import { config, getAdminAuthHeaders } from '../../lib/api-auth';

type FeatureFlag = {
  id: string;
  key: string;
  enabled: boolean;
  tenantId: string | null;
  tenantName: string | null;
  description: string | null;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export function FeatureFlagManagement() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [flagsResponse, tenantsResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}/platform-admin/feature-flags`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        }),
        fetch(`${config.apiBaseUrl}/platform-admin/tenants`, {
          cache: 'no-store',
          headers: getAdminAuthHeaders()
        })
      ]);

      if (!flagsResponse.ok || !tenantsResponse.ok) {
        const payload =
          ((await flagsResponse.json().catch(() => null)) as {
            message?: string;
          } | null) ??
          ((await tenantsResponse.json().catch(() => null)) as {
            message?: string;
          } | null);

        setError(payload?.message ?? 'Unable to load feature flags.');
        setFeatureFlags([]);
        setTenants([]);
        return;
      }

      const [flagsPayload, tenantsPayload] = (await Promise.all([
        flagsResponse.json(),
        tenantsResponse.json()
      ])) as [FeatureFlag[], Tenant[]];

      setFeatureFlags(flagsPayload);
      setTenants(tenantsPayload);
    } catch {
      setError('API unavailable. Start the local API and try again.');
      setFeatureFlags([]);
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/platform-admin/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders()
        },
        body: JSON.stringify({
          key,
          enabled,
          tenantId: tenantId || null,
          description
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to create feature flag.');
        return;
      }

      setKey('');
      setDescription('');
      setEnabled(false);
      setTenantId('');
      await loadData();
    } catch {
      setError('Unable to create feature flag.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(featureFlag: FeatureFlag) {
    setError('');

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/platform-admin/feature-flags/${featureFlag.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders()
          },
          body: JSON.stringify({
            enabled: !featureFlag.enabled
          })
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? 'Unable to toggle feature flag.');
        return;
      }

      await loadData();
    } catch {
      setError('Unable to toggle feature flag.');
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        title="Create feature flag"
        description="Define a global or tenant-specific platform capability flag."
      >
        <form className="space-y-5" onSubmit={handleCreate}>
          <label className="block">
            <span className="text-sm font-medium text-admin-text">Key</span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="plugins.claims-dashboard"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">
              Description
            </span>
            <input
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Enables the claims dashboard plugin."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-admin-text">
              Tenant scope
            </span>
            <select
              className="mt-2 w-full rounded-2xl border border-admin-border bg-white px-4 py-3 text-sm text-admin-text outline-none focus:border-admin-accent"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
            >
              <option value="">Global</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 text-sm text-admin-text">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            Enabled
          </label>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-admin-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Creating flag...' : 'Create feature flag'}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Feature flags"
        description="Current feature flag states returned by the versioned API."
      >
        {isLoading ? (
          <p className="text-sm text-admin-muted">Loading feature flags...</p>
        ) : featureFlags.length === 0 ? (
          <p className="text-sm text-admin-muted">
            No feature flags found. Create one to start controlling platform
            features.
          </p>
        ) : (
          <div className="space-y-4">
            {featureFlags.map((featureFlag) => (
              <article
                key={featureFlag.id}
                className="rounded-2xl border border-admin-border bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-admin-text">
                      {featureFlag.key}
                    </h2>
                    <p className="mt-1 text-sm text-admin-muted">
                      {featureFlag.description || 'No description provided.'}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-admin-accent">
                      {featureFlag.tenantName
                        ? `Tenant: ${featureFlag.tenantName}`
                        : 'Global'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleToggle(featureFlag)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      featureFlag.enabled
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {featureFlag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
