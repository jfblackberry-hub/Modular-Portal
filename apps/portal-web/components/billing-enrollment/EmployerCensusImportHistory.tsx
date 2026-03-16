'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { CensusImportBatch } from '../../lib/hris-census-import-data';
import { EmptyState, StatusBadge } from '../portal-ui';

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function buildErrorCsv(batch: CensusImportBatch) {
  const header = ['Row', 'Employee ID', 'Error'];
  const rows = batch.validationErrors.map((error) => [
    String(error.rowNumber),
    error.employeeId,
    error.message
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export function EmployerCensusImportHistory({ imports }: { imports: CensusImportBatch[] }) {
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') {
      return imports;
    }

    return imports.filter((item) => item.importStatus === statusFilter);
  }, [imports, statusFilter]);

  function downloadErrorReport(batch: CensusImportBatch) {
    const csv = buildErrorCsv(batch);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${batch.fileName.replace(/\.[^/.]+$/, '')}-error-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function reprocessImport(batch: CensusImportBatch) {
    if (batch.totalRecords === 0) {
      setMessage('Cannot reprocess an empty import file.');
      return;
    }

    setMessage(`Reprocess requested for ${batch.fileName}.`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">HRIS &amp; Census Import</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Import History
        </h1>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Import Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-1 h-11 w-56 rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Completed with Warnings">Completed with Warnings</option>
              <option value="Partially Successful">Partially Successful</option>
              <option value="Failed">Failed</option>
            </select>
          </label>

          <Link
            href="/dashboard/billing-enrollment/census-import"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Upload New Census
          </Link>
        </div>

        {message ? (
          <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</p>
        ) : null}
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Census Imports</h2>
          <p className="text-sm text-[var(--text-secondary)]">Showing {filtered.length} of {imports.length}</p>
        </div>

        {imports.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No imports generated yet" description="Import history appears after your first census upload." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No matching imports" description="Adjust your status filter to see matching import batches." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Import Date</th>
                  <th>File Name</th>
                  <th>Total Records</th>
                  <th>Records Added</th>
                  <th>Records Updated</th>
                  <th>Records Rejected</th>
                  <th>Import Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((batch) => (
                  <tr key={batch.id}>
                    <td>{formatDate(batch.importDate)}</td>
                    <td>{batch.fileName}</td>
                    <td>{batch.totalRecords}</td>
                    <td>{batch.recordsAdded}</td>
                    <td>{batch.recordsUpdated}</td>
                    <td>{batch.recordsRejected}</td>
                    <td>
                      <StatusBadge label={batch.importStatus} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/dashboard/billing-enrollment/census-import/history/${batch.id}`} className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]">
                          View Import Details
                        </Link>
                        <button type="button" onClick={() => downloadErrorReport(batch)} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          Download Error Report
                        </button>
                        <button type="button" onClick={() => reprocessImport(batch)} className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Reprocess Import
                        </button>
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
