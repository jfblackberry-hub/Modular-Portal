import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getEmployerDashboard } from '../../../../../../lib/billing-enrollment-api';
import { getEmployerDocumentByIdForTenant } from '../../../../../../lib/employer-document-center-data';
import { getPortalSessionUser } from '../../../../../../lib/portal-session';
import { StatusBadge } from '../../../../../../components/portal-ui';

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

export default async function EmployerDocumentViewerPage({
  params
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  const user = await getPortalSessionUser();
  const tenantId = user?.tenant.id ?? 'unknown-tenant';
  const dashboard = user ? await getEmployerDashboard(user.id).catch(() => null) : null;
  const document = getEmployerDocumentByIdForTenant(tenantId, documentId, dashboard?.documentCenter);

  if (!document) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Document Viewer</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">{document.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{document.category} • {document.type}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/billing-enrollment/document-center" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">Back to Document Center</Link>
          <Link href={`/dashboard/billing-enrollment/document-center/download/${document.id}`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">Download Document</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Upload Date</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">{formatDate(document.uploadDate)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Effective Date</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">{formatDate(document.effectiveDate)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Expiration Date</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">{formatDate(document.expirationDate)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</p>
          <div className="mt-2"><StatusBadge label={document.status === 'Pending Processing' ? 'Pending' : document.status} /></div>
        </article>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Document Metadata</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--text-secondary)]">Document Name</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{document.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--text-secondary)]">Document Type</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{document.type}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--text-secondary)]">Uploaded By</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{document.uploadedBy}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[var(--text-secondary)]">Version Number</dt>
            <dd className="font-semibold text-[var(--text-primary)]">{document.version}</dd>
          </div>
          {document.associatedEmployee ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Associated Employee</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{document.associatedEmployee}</dd>
            </div>
          ) : null}
          {document.description ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-[var(--text-secondary)]">
              {document.description}
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
