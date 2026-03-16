import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EmptyState, StatusBadge } from '../../../../../components/portal-ui';
import { getOpenEnrollmentRecordByIdForTenant } from '../../../../../lib/open-enrollment-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

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

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

export default async function OpenEnrollmentRecordDetailPage({
  params
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const sessionUser = await getPortalSessionUser();
  const tenantId = sessionUser?.tenant.id ?? 'unknown-tenant';
  const record = getOpenEnrollmentRecordByIdForTenant(tenantId, recordId);

  if (!record) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Open Enrollment Detail</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {record.employeeName}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Employee ID {record.employeeId} • {record.department}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/billing-enrollment/open-enrollment"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
          >
            Back to Progress
          </Link>
          <a
            href="#audit-history"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            View Audit History
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Enrollment Status</p>
          <div className="mt-2">
            <StatusBadge label={record.enrollmentStatus} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Submission: {formatDate(record.submissionDate)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Selected Plan</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{record.selectedPlan}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Coverage tier: {record.coverageTier}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Submission Timestamp</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatDateTime(record.submittedAt)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Last reminder: {formatDate(record.lastReminderSent)}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Reminder Delivery</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{record.reminderFailures}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Reminder failure attempts logged</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2" id="elections">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Employee Information</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Employee</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{record.employeeName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Employee ID</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{record.employeeId}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Department</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{record.department}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Enrollment Status</dt>
              <dd>
                <StatusBadge label={record.enrollmentStatus} />
              </dd>
            </div>
          </dl>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Coverage Election Comparison</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Current Coverage</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">{record.currentCoverage.plan}</p>
              <p className="text-sm text-[var(--text-secondary)]">{record.currentCoverage.tier}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Contribution: {formatCurrency(record.currentCoverage.monthlyContribution)} / month
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">New Plan Selection</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">{record.newCoverage.plan}</p>
              <p className="text-sm text-[var(--text-secondary)]">{record.newCoverage.tier}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Contribution: {formatCurrency(record.newCoverage.monthlyContribution)} / month
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dependent Coverage</h2>
          {record.dependents.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No dependents"
                description="No dependent records were included with this enrollment election."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Relationship</th>
                    <th>Coverage Status</th>
                  </tr>
                </thead>
                <tbody>
                  {record.dependents.map((dependent) => (
                    <tr key={dependent.id}>
                      <td>{dependent.name}</td>
                      <td>{dependent.relationship}</td>
                      <td>
                        <StatusBadge label={dependent.coverageStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Contribution Amounts</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              <dt className="text-[var(--text-secondary)]">Current Employee Contribution</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{formatCurrency(record.currentCoverage.monthlyContribution)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              <dt className="text-[var(--text-secondary)]">New Employee Contribution</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{formatCurrency(record.newCoverage.monthlyContribution)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2">
              <dt className="text-[var(--text-secondary)]">Monthly Delta</dt>
              <dd className="font-semibold text-[var(--text-primary)]">
                {formatCurrency(record.newCoverage.monthlyContribution - record.currentCoverage.monthlyContribution)}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section id="audit-history" className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Audit History</h2>
        {record.auditHistory.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No audit history"
              description="Audit events will appear as enrollment steps are completed."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {record.auditHistory.map((event) => (
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
        )}
      </section>
    </div>
  );
}
