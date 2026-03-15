'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { ProviderPortalConfig, ProviderResourceItem } from '../../../config/providerPortalConfig';
import { PageHeader, SurfaceCard } from '../../portal-ui';

const resourceCategories: ProviderResourceItem['category'][] = [
  'Forms',
  'Manuals',
  'Policies',
  'Training',
  'Claims Resources',
  'Authorization Resources',
  'Payment Resources',
  'Practice Administration'
];

function getResourceCta(resource: ProviderResourceItem) {
  if (resource.linkType === 'download') {
    return { label: 'Download', external: false };
  }

  if (resource.linkType === 'external') {
    return { label: 'Open External', external: true };
  }

  return { label: 'Open', external: false };
}

function ResourceLink({ resource }: { resource: ProviderResourceItem }) {
  const cta = getResourceCta(resource);

  if (resource.linkType === 'internal') {
    return (
      <Link
        href={resource.linkTarget}
        className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--tenant-primary-color)]"
      >
        {cta.label}
      </Link>
    );
  }

  return (
    <a
      href={resource.linkTarget}
      target={cta.external ? '_blank' : undefined}
      rel={cta.external ? 'noreferrer noopener' : undefined}
      download={resource.linkType === 'download' ? true : undefined}
      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--tenant-primary-color)]"
    >
      {cta.label}
    </a>
  );
}

export function ProviderResourcesLibraryPage({ config }: { config: ProviderPortalConfig }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProviderResourceItem['category']>('All');

  const filteredResources = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return config.providerResources.filter((resource) => {
      const categoryMatch = selectedCategory === 'All' || resource.category === selectedCategory;
      if (!categoryMatch) {
        return false;
      }

      if (!loweredQuery) {
        return true;
      }

      const searchable = [
        resource.title,
        resource.type,
        resource.description,
        resource.tags.join(' '),
        resource.lineOfBusinessApplicability.join(' '),
        resource.linkTarget,
        resource.lastUpdated
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(loweredQuery);
    });
  }, [config.providerResources, query, selectedCategory]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.displayName}
        title="Provider Resources Library"
        description="Find forms, manuals, policies, training, and operational references in one searchable library."
      />

      <SurfaceCard title="Search and Filters" description="Search by title, type, tags, line of business, or target.">
        <div className="space-y-4">
          <label className="block text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Search resources</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="portal-input px-3 py-2 text-sm"
              placeholder="Search by title, tag, type, line of business, or link target"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Categories</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === 'All'
                    ? 'bg-[var(--tenant-primary-color)] text-white'
                    : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]'
                }`}
              >
                All
              </button>
              {resourceCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === category
                      ? 'bg-[var(--tenant-primary-color)] text-white'
                      : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Resource List"
        description={`Showing ${filteredResources.length} resource${filteredResources.length === 1 ? '' : 's'}.`}
      >
        <div className="space-y-3">
          {filteredResources.map((resource) => (
            <article key={resource.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{resource.title}</h3>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {resource.type}
                    </span>
                    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {resource.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{resource.description}</p>
                </div>
                <ResourceLink resource={resource} />
              </div>

              <div className="mt-3 grid gap-2 text-xs text-[var(--text-muted)] md:grid-cols-2">
                <p>
                  <span className="font-semibold text-[var(--text-secondary)]">Tags:</span> {resource.tags.join(', ')}
                </p>
                <p>
                  <span className="font-semibold text-[var(--text-secondary)]">LOB Applicability:</span>{' '}
                  {resource.lineOfBusinessApplicability.join(', ')}
                </p>
                <p>
                  <span className="font-semibold text-[var(--text-secondary)]">Last Updated:</span> {resource.lastUpdated}
                </p>
                <p>
                  <span className="font-semibold text-[var(--text-secondary)]">Link Target:</span> {resource.linkTarget}
                </p>
              </div>
            </article>
          ))}

          {filteredResources.length === 0 ? (
            <article className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-[var(--text-primary)]">No resources match your filters.</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Try another category or search term.</p>
            </article>
          ) : null}
        </div>
      </SurfaceCard>
    </div>
  );
}
