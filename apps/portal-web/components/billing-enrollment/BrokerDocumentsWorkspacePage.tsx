'use client';

import { useMemo, useState } from 'react';

import type { BrokerDocumentRecord } from '../../lib/broker-operations-data';
import { EmptyState, InlineButton, PageHeader, StatusBadge, SurfaceCard } from '../portal-ui';

function DocumentDetailModal({
  document,
  onClose
}: {
  document: BrokerDocumentRecord | null;
  onClose: () => void;
}) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40 modal-fade-in" onClick={onClose} aria-label="Close document detail" />
      <section className="modal-scale-in relative z-10 max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Document detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{document.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{document.groupName ?? 'Broker document'} • {document.category}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Status</p>
            <div className="mt-2"><StatusBadge label={document.status} /></div>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Updated</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{document.updatedAt}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Uploaded by</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{document.uploadedBy}</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-white p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Summary</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{document.description}</p>
        </div>
      </section>
    </div>
  );
}

export function BrokerDocumentsWorkspacePage({
  documents,
  filterOptions
}: {
  documents: BrokerDocumentRecord[];
  filterOptions: {
    categories: string[];
    statuses: string[];
  };
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<BrokerDocumentRecord | null>(null);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return documents.filter((document) => {
      if (
        normalizedSearch &&
        ![document.title, document.groupName ?? '', document.description]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }
      if (category && document.category !== category) return false;
      if (status && document.status !== status) return false;
      return true;
    });
  }, [category, documents, search, status]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Documents"
        description="Broker document center for census files, proposals, renewal packets, commission statements, plan documents, and employer-submitted materials."
        actions={<InlineButton href="/broker/documents" tone="secondary">Upload</InlineButton>}
      />

      <SurfaceCard title="Document center" description="Search and organize broker documents by category, status, and related employer group.">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Search documents</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or group"
              className="portal-input w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
            />
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]">
              <option value="">All categories</option>
              {filterOptions.categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]">
              <option value="">All statuses</option>
              {filterOptions.statuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="space-y-4">
          <SurfaceCard title="Broker document library" description={`${filteredDocuments.length} document${filteredDocuments.length === 1 ? '' : 's'} match the current search and filter set.`}>
            {filteredDocuments.length === 0 ? (
              <EmptyState title="No documents match this view" description="Try clearing the category or status filter to surface more broker documents." />
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => setSelectedDocument(document)}
                    className="w-full rounded-3xl border border-[var(--border-subtle)] bg-white p-4 text-left transition hover:border-[var(--tenant-primary-color)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{document.title}</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{document.groupName ?? 'Broker shared'} • {document.category}</p>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">Updated {document.updatedAt} by {document.uploadedBy}</p>
                      </div>
                      <StatusBadge label={document.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        <div className="space-y-4">
          <SurfaceCard title="Recent uploads" description="Most recent broker-facing files and statement updates.">
            <div className="space-y-3">
              {documents.slice(0, 4).map((document) => (
                <div key={`${document.id}-recent`} className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{document.title}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{document.updatedAt}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard title="Upload action" description="Mock upload call-to-action for broker census, proposal, and renewal packet workflows.">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">Use this action to represent broker document intake without requiring live storage integration in this sprint.</p>
            <div className="mt-4">
              <InlineButton href="/broker/documents" tone="secondary">Upload</InlineButton>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <DocumentDetailModal document={selectedDocument} onClose={() => setSelectedDocument(null)} />
    </div>
  );
}
