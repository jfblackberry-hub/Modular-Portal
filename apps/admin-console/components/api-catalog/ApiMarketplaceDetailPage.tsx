'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchAdminJsonCached } from '../../lib/admin-client-data';
import { apiBaseUrl, getAdminAuthHeaders } from '../../lib/api-auth';
import {
  type ApiCatalogEntry,
  formatApiCatalogCategory,
  formatTenantAvailability} from '../../lib/api-catalog-api';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState
} from '../admin-ui';

type ApiMarketplaceDetailPageProps = {
  slug: string;
};

function DetailPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
      {label}
    </span>
  );
}

function ModelBlock({
  models,
  title
}: {
  models: string[];
  title: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {models.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No models listed for this API.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {models.map((model) => (
            <span
              key={model}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
            >
              {model}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function ApiMarketplaceDetailPage({
  slug
}: ApiMarketplaceDetailPageProps) {
  const [entries, setEntries] = useState<ApiCatalogEntry[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadEntries() {
      setIsLoading(true);

      try {
        const payload = await fetchAdminJsonCached<ApiCatalogEntry[]>(
          `${apiBaseUrl}/api-catalog`,
          {
            cacheContext: { scope: 'platform' },
            headers: getAdminAuthHeaders(),
            ttlMs: 20_000,
            resourceDiscriminator: 'api-catalog::detail'
          }
        );

        if (isCancelled) {
          return;
        }

        setEntries(payload);
        setError('');
      } catch (nextError) {
        if (isCancelled) {
          return;
        }

        setEntries([]);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load the API catalog entry.'
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
  }, []);

  const entry = useMemo(
    () => entries.find((catalogEntry) => catalogEntry.slug === slug) ?? null,
    [entries, slug]
  );
  const relatedEntries = useMemo(
    () =>
      entry
        ? entries
            .filter(
              (catalogEntry) =>
                catalogEntry.slug !== entry.slug &&
                catalogEntry.category === entry.category
            )
            .slice(0, 3)
        : [],
    [entries, entry]
  );

  if (isLoading) {
    return (
      <AdminLoadingState
        title="Loading API details"
        description="Fetching the current API catalog entry from the backend."
      />
    );
  }

  if (error) {
    return (
      <AdminErrorState
        title="Unable to load API details"
        description={error}
      />
    );
  }

  if (!entry) {
    return (
      <AdminEmptyState
        title="API not found"
        description="The requested API catalog entry is not available for the current session."
        action={
          <Link
            href="/admin/shared/api-catalog"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"
          >
            Back to catalog
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(145deg,#0b1320_0%,#132d48_44%,#0f766e_100%)] px-7 py-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <DetailPill label={formatApiCatalogCategory(entry.category)} />
              <DetailPill label={entry.vendor} />
              <DetailPill label={entry.version} />
              <DetailPill label={formatTenantAvailability(entry.tenantAvailability)} />
            </div>
            <h1 className="mt-5 text-[2.5rem] font-semibold tracking-[-0.05em] text-white">
              {entry.name}
            </h1>
            <p className="mt-4 max-w-3xl text-[1rem] leading-7 text-slate-200">
              {entry.description}
            </p>
          </div>

          <div className="min-w-[18rem] rounded-[1.5rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-300">
              API metadata
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-slate-300">Endpoint</p>
                <p className="mt-1 break-all text-lg font-semibold text-white">
                  {entry.endpoint}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Input models</p>
                <p className="mt-1 text-lg font-semibold text-white">{entry.inputModels.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Output models</p>
                <p className="mt-1 text-lg font-semibold text-white">{entry.outputModels.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/shared/api-catalog"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-50"
          >
            Back to catalog
          </Link>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.08fr)_24rem]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Catalog summary
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Category
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {formatApiCatalogCategory(entry.category)}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Vendor
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">{entry.vendor}</p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Endpoint
                </p>
                <p className="mt-2 break-all text-base font-semibold text-slate-950">
                  {entry.endpoint}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Availability
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {formatTenantAvailability(entry.tenantAvailability)}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <ModelBlock models={entry.inputModels} title="Input models" />
            <ModelBlock models={entry.outputModels} title="Output models" />
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">Related APIs</h2>
          {relatedEntries.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-slate-600">
              No related APIs from the same category are currently visible to this session.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {relatedEntries.map((relatedEntry) => (
                <Link
                  key={relatedEntry.slug}
                  href={`/admin/shared/api-catalog/${relatedEntry.slug}`}
                  className="block rounded-[1.2rem] border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <p className="font-semibold text-slate-950">{relatedEntry.name}</p>
                  <p className="mt-1 text-sm font-medium text-emerald-700">
                    {relatedEntry.vendor}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{relatedEntry.description}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
