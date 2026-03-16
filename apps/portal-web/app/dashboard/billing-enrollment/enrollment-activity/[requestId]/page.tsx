import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getEmployerEnrollmentActivityById } from '../../../../../lib/billing-enrollment-api';
import { getPortalSessionUser } from '../../../../../lib/portal-session';
import { EmptyState, StatusBadge } from '../../../../../components/portal-ui';

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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default async function EnrollmentRequestDetailPage({
  params
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const sessionUser = await getPortalSessionUser();
  const request = sessionUser ? await getEmployerEnrollmentActivityById(sessionUser.id, requestId) : null;

  if (!request) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Enrollment Request Detail</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {request.requestType}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {request.employeeName} ({request.employeeId}) • Submitted {formatDate(request.submissionDate)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/billing-enrollment/enrollment-activity"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
          >
            Back to Pending Queue
          </Link>
          <Link
            href="/dashboard/billing-enrollment/enrollment-activity/history"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            View Enrollment History
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</p>
          <div className="mt-2"><StatusBadge label={request.status} /></div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Error State: {request.errorState}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Submission Date</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatDate(request.submissionDate)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Submitted by {request.submittedBy}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Effective Date</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatDate(request.effectiveDate)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Target effective coverage date</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Plan Selection</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{request.planSelection}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Department: {request.department}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Employee Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Employee</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{request.employeeName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Employee ID</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{request.employeeId}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Request Type</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{request.requestType}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Submitted By</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{request.submittedBy}</dd>
            </div>
          </dl>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Coverage Change</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Current Coverage</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">{request.currentCoverage.plan}</p>
              <p className="text-sm text-[var(--text-secondary)]">{request.currentCoverage.tier}</p>
              <div className="mt-2"><StatusBadge label={request.currentCoverage.status} /></div>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Requested Coverage</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">{request.requestedCoverage.plan}</p>
              <p className="text-sm text-[var(--text-secondary)]">{request.requestedCoverage.tier}</p>
              <div className="mt-2"><StatusBadge label={request.requestedCoverage.status} /></div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Submitted Data</h2>
          <dl className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            {(Object.entries(request.submittedData) as Array<[string, string]>).map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
                <dt className="font-medium text-[var(--text-primary)]">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Supporting Dependents</h2>
          {request.supportingDependents.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No supporting dependents"
                description="This request does not include dependent records."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {request.supportingDependents.map((dependent) => (
                <li key={dependent.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[var(--text-primary)]">{dependent.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {dependent.relationship} • DOB {formatDate(dependent.dateOfBirth)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Qualifying Life Event</h2>
          {!request.qualifyingLifeEvent ? (
            <div className="mt-4">
              <EmptyState
                title="No qualifying life event"
                description="This enrollment request is not tied to a life event."
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-[var(--text-primary)]">{request.qualifyingLifeEvent.type}</p>
              <p className="mt-1 text-[var(--text-secondary)]">Event date: {formatDate(request.qualifyingLifeEvent.eventDate)}</p>
              <p className="mt-2 text-[var(--text-secondary)]">{request.qualifyingLifeEvent.notes}</p>
            </div>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Validation Messages</h2>
          {request.validationMessages.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No validation issues"
                description="No errors or warnings were detected for this request."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {request.validationMessages.map((validation) => (
                <li key={validation.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-[var(--text-secondary)]">{validation.message}</p>
                    <StatusBadge label={validation.severity} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Approval History</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {request.approvalHistory.map((event) => (
                  <tr key={event.id}>
                    <td><StatusBadge label={event.action} /></td>
                    <td>{event.actor}</td>
                    <td>{formatDateTime(event.occurredAt)}</td>
                    <td>{event.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article id="audit-trail" className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Audit Trail</h2>
          <ul className="mt-4 space-y-2">
            {request.auditTrail.map((event) => (
              <li key={event.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--text-primary)]">{event.action}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDateTime(event.occurredAt)}</p>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.actor}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{event.details}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
