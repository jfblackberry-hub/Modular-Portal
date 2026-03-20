'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { DocumentCategory, DocumentStatus, DocumentType, EmployerDocumentRecord } from '../../lib/employer-document-center-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type Filters = {
  query: string;
  category: 'all' | DocumentCategory;
  type: 'all' | DocumentType;
  uploadDate: string;
  effectiveDate: string;
  expirationDate: string;
};

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function EmployerDocumentCenterLibrary({
  embedded = false,
  documents,
  recentDocuments,
  categories,
  types
}: {
  embedded?: boolean;
  documents: EmployerDocumentRecord[];
  recentDocuments: EmployerDocumentRecord[];
  categories: DocumentCategory[];
  types: DocumentType[];
}) {
  const [filters, setFilters] = useState<Filters>({
    query: '',
    category: 'all',
    type: 'all',
    uploadDate: '',
    effectiveDate: '',
    expirationDate: ''
  });

  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadForm, setUploadForm] = useState({
    fileName: '',
    description: '',
    category: 'Eligibility Documentation' as
      | 'Eligibility Correction'
      | 'Enrollment Documentation'
      | 'Compliance Submission'
      | 'Life Event Supporting Document'
      | 'Eligibility Documentation',
    associatedEmployee: ''
  });

  const filteredDocuments = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesQuery =
        !query ||
        [document.name, document.type, document.category, document.uploadedBy, document.associatedEmployee ?? '']
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesCategory = filters.category === 'all' || document.category === filters.category;
      const matchesType = filters.type === 'all' || document.type === filters.type;
      const matchesUploadDate = !filters.uploadDate || document.uploadDate === filters.uploadDate;
      const matchesEffectiveDate = !filters.effectiveDate || document.effectiveDate === filters.effectiveDate;
      const matchesExpirationDate = !filters.expirationDate || document.expirationDate === filters.expirationDate;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesType &&
        matchesUploadDate &&
        matchesEffectiveDate &&
        matchesExpirationDate
      );
    });
  }, [documents, filters]);

  function statusLabel(status: DocumentStatus) {
    return status === 'Pending Processing' ? 'Pending' : status;
  }

  function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadMessage('');
    setUploadError('');

    if (!uploadForm.fileName.trim()) {
      setUploadError('File name is required.');
      return;
    }

    if (uploadForm.fileName.toLowerCase().includes('large')) {
      setUploadError('Upload failed: file exceeds mock maximum size threshold.');
      return;
    }

    setUploadMessage('Secure file submitted successfully and is pending processing.');
    setUploadForm({
      fileName: '',
      description: '',
      category: 'Eligibility Documentation',
      associatedEmployee: ''
    });
  }

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Document Center</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Document Library</h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
            Access plan documents, billing statements, compliance notices, and secure file exchange in one place.
          </p>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="portal-card p-5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Documents</h2>
            <Link href="/dashboard/billing-enrollment/document-center/download/category/Billing%20Documents" className="text-sm font-semibold text-[var(--tenant-primary-color)]">Download Statements</Link>
          </div>
          {recentDocuments.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No documents available" description="Recent documents will appear here when generated or uploaded." />
            </div>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {recentDocuments.map((document) => (
                <li key={document.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[var(--text-primary)]">{document.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{document.category}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Secure File Exchange</h2>
          <form className="mt-4 space-y-3" onSubmit={handleUpload}>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              File Name
              <input value={uploadForm.fileName} onChange={(event) => setUploadForm((current) => ({ ...current, fileName: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="enrollment-correction.pdf" />
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Description
              <input value={uploadForm.description} onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Eligibility correction for March cycle" />
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Category
              <select value={uploadForm.category} onChange={(event) => setUploadForm((current) => ({ ...current, category: event.target.value as typeof uploadForm.category }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>Eligibility Correction</option>
                <option>Enrollment Documentation</option>
                <option>Compliance Submission</option>
                <option>Life Event Supporting Document</option>
                <option>Eligibility Documentation</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Associated Employee (optional)
              <input value={uploadForm.associatedEmployee} onChange={(event) => setUploadForm((current) => ({ ...current, associatedEmployee: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" placeholder="Priya Shah" />
            </label>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">Send Secure File</button>
          </form>
          {uploadMessage ? <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{uploadMessage}</p> : null}
          {uploadError ? <p className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">{uploadError}</p> : null}
          <p className="mt-3 text-xs text-[var(--text-muted)]">Upload use cases: eligibility corrections, enrollment docs, compliance submissions, and life event supporting files.</p>
        </article>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[260px] flex-[2_1_320px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({ ...current, query: event.target.value }))
              }
              className="mt-1 h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
              placeholder="Search documents"
            />
          </label>
          <label className="min-w-[180px] flex-[1_1_180px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Document Category</span>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value as Filters['category']
                }))
              }
              className="mt-1 h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="min-w-[160px] flex-[1_1_160px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Document Type</span>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({ ...current, type: event.target.value as Filters['type'] }))
              }
              className="mt-1 h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
            >
              <option value="all">All types</option>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="min-w-[150px] flex-[1_1_150px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Upload Date</span>
            <input
              type="date"
              value={filters.uploadDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, uploadDate: event.target.value }))
              }
              className="mt-1 h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
            />
          </label>
          <label className="min-w-[150px] flex-[1_1_150px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Effective Date</span>
            <input
              type="date"
              value={filters.effectiveDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, effectiveDate: event.target.value }))
              }
              className="mt-1 h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
            />
          </label>
          <label className="min-w-[150px] flex-[1_1_150px]">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Expiration Date</span>
            <input
              type="date"
              value={filters.expirationDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, expirationDate: event.target.value }))
              }
              className="mt-1 h-11 w-full appearance-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setFilters({
                query: '',
                category: 'all',
                type: 'all',
                uploadDate: '',
                effectiveDate: '',
                expirationDate: ''
              })
            }
            className="h-11 rounded-full border border-[var(--border-subtle)] px-4 text-sm font-semibold text-[var(--text-secondary)]"
          >
            Clear filters
          </button>
        </div>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Documents</h2>
          <p className="text-sm text-[var(--text-secondary)]">Showing {filteredDocuments.length} of {documents.length}</p>
        </div>

        {documents.length === 0 ? (
          <div className="mt-4"><EmptyState title="No documents available" description="No documents have been generated for this employer yet." /></div>
        ) : filteredDocuments.length === 0 ? (
          <div className="mt-4"><EmptyState title="No matching results" description="No documents match the selected filters." /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Document Type</th>
                  <th>Category</th>
                  <th>Upload Date</th>
                  <th>Effective Date</th>
                  <th>Expiration Date</th>
                  <th>Uploaded By</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <p className="font-semibold text-[var(--text-primary)]">{document.name}</p>
                      {document.associatedEmployee ? <p className="text-xs text-[var(--text-muted)]">Employee: {document.associatedEmployee}</p> : null}
                    </td>
                    <td>{document.type}</td>
                    <td>{document.category}</td>
                    <td>{formatDate(document.uploadDate)}</td>
                    <td>{formatDate(document.effectiveDate)}</td>
                    <td>{formatDate(document.expirationDate)}</td>
                    <td>{document.uploadedBy}</td>
                    <td>{document.version}</td>
                    <td><StatusBadge label={statusLabel(document.status)} /></td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/dashboard/billing-enrollment/document-center/view/${document.id}`} className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]">View Document</Link>
                        <Link href={`/dashboard/billing-enrollment/document-center/download/${document.id}`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">Download Document</Link>
                        <Link href={`/dashboard/billing-enrollment/document-center/download/category/${encodeURIComponent(document.category)}`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">Download Category</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
