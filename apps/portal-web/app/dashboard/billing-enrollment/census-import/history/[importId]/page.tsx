import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EmptyState, StatusBadge } from '../../../../../../components/portal-ui';
import { getEmployerDashboard } from '../../../../../../lib/billing-enrollment-api';
import { getCensusImportByIdForTenant } from '../../../../../../lib/hris-census-import-data';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default async function CensusImportDetailPage({
  params
}: {
  params: Promise<{ importId: string }>;
}) {
  const { importId } = await params;
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const dashboard = sessionUser ? await getEmployerDashboard(sessionUser.id).catch(() => null) : null;
  const importBatch = getCensusImportByIdForTenant(tenantId, importId, dashboard?.hrisImport);

  if (!importBatch) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Census Import Detail</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {importBatch.fileName}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Imported {formatDate(importBatch.importDate)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/billing-enrollment/census-import/history" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            Back to Import History
          </Link>
          <Link href="/dashboard/billing-enrollment/census-import/errors" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Resolve Errors
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Total Records</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{importBatch.totalRecords}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Records Added</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{importBatch.recordsAdded}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Records Updated</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{importBatch.recordsUpdated}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Import Status</p>
          <div className="mt-2"><StatusBadge label={importBatch.importStatus} /></div>
        </article>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Validation Errors</h2>
        {importBatch.validationErrors.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No import errors" description="This import completed without validation failures." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Employee ID</th>
                  <th>Error Message</th>
                </tr>
              </thead>
              <tbody>
                {importBatch.validationErrors.map((error, index) => (
                  <tr key={`${error.rowNumber}-${error.employeeId}-${index}`}>
                    <td>{error.rowNumber}</td>
                    <td>{error.employeeId}</td>
                    <td>{error.message}</td>
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
