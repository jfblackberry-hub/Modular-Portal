'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  EnrollmentCycle,
  OpenEnrollmentAnalytics,
  OpenEnrollmentRecord,
  OpenEnrollmentStatus,
  OpenEnrollmentSummary
} from '../../lib/open-enrollment-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type Filters = {
  query: string;
  enrollmentStatus: 'all' | OpenEnrollmentStatus;
  department: 'all' | string;
  planSelection: 'all' | string;
  coverageTier: 'all' | string;
  submissionDate: string;
};

type ReminderChannel = 'email' | 'portal';

type ReminderResponse = {
  message: string;
  delivered: number;
  failed: number;
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

function buildCsv(records: OpenEnrollmentRecord[]) {
  const header = [
    'Employee Name',
    'Employee ID',
    'Department',
    'Enrollment Status',
    'Selected Plan',
    'Coverage Tier',
    'Submission Date',
    'Last Reminder Sent'
  ];

  const rows = records.map((record) => [
    record.employeeName,
    record.employeeId,
    record.department,
    record.enrollmentStatus,
    record.selectedPlan,
    record.coverageTier,
    record.submissionDate ?? '',
    record.lastReminderSent ?? ''
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function MiniBars({
  title,
  rows,
  suffix = ''
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  suffix?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <article className="portal-card p-5">
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">{row.label}</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {row.value.toLocaleString()}
                {suffix}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[var(--tenant-primary-color)]"
                style={{ width: `${Math.max(5, (row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function OpenEnrollmentOverview({
  embedded = false,
  cycle,
  summary,
  records,
  analytics,
  departments,
  plans,
  coverageTiers
}: {
  embedded?: boolean;
  cycle: EnrollmentCycle | null;
  summary: OpenEnrollmentSummary;
  records: OpenEnrollmentRecord[];
  analytics: OpenEnrollmentAnalytics;
  departments: string[];
  plans: string[];
  coverageTiers: string[];
}) {
  const [filters, setFilters] = useState<Filters>({
    query: '',
    enrollmentStatus: 'all',
    department: 'all',
    planSelection: 'all',
    coverageTier: 'all',
    submissionDate: ''
  });
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderError, setReminderError] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = [
        record.employeeName,
        record.employeeId,
        record.department,
        record.selectedPlan,
        record.coverageTier
      ]
        .join(' ')
        .toLowerCase();

      const queryMatch = !normalizedQuery || searchable.includes(normalizedQuery);
      const statusMatch =
        filters.enrollmentStatus === 'all' || record.enrollmentStatus === filters.enrollmentStatus;
      const departmentMatch = filters.department === 'all' || record.department === filters.department;
      const planMatch = filters.planSelection === 'all' || record.selectedPlan === filters.planSelection;
      const tierMatch = filters.coverageTier === 'all' || record.coverageTier === filters.coverageTier;
      const submissionDateMatch = !filters.submissionDate || record.submissionDate === filters.submissionDate;

      return queryMatch && statusMatch && departmentMatch && planMatch && tierMatch && submissionDateMatch;
    });
  }, [filters, records]);

  const pendingRecords = useMemo(
    () => filtered.filter((record) => record.enrollmentStatus !== 'Completed'),
    [filtered]
  );

  async function sendReminder(channel: ReminderChannel, mode: 'pending' | 'single', recordId?: string) {
    setIsSendingReminder(true);
    setReminderError('');
    setReminderMessage('');

    try {
      const response = await fetch('/api/billing-enrollment/open-enrollment/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel,
          mode,
          recordIds: recordId ? [recordId] : pendingRecords.map((record) => record.id)
        })
      });

      const payload = (await response.json()) as ReminderResponse | { message: string };

      if (!response.ok) {
        throw new Error(payload.message);
      }

      const successPayload = payload as ReminderResponse;
      setReminderMessage(
        `${successPayload.message} (${successPayload.delivered} delivered, ${successPayload.failed} failed).`
      );
    } catch (error) {
      setReminderError(
        error instanceof Error
          ? error.message
          : 'Unable to send reminder notifications right now.'
      );
    } finally {
      setIsSendingReminder(false);
    }
  }

  function downloadEnrollmentCsv() {
    const csv = buildCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'open-enrollment-progress.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Open Enrollment Management</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
            Open Enrollment Overview
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
            Monitor completion progress, identify pending employees, and review enrollment elections by department.
          </p>
        </section>
      )}

      <section id="reminder-notifications" className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Open Enrollment Status</h2>
          <StatusBadge label={summary.status} />
        </div>

        {cycle ? (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Start Date</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatDate(cycle.startDate)}</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">End Date</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatDate(cycle.endDate)}</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Eligible</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{summary.totalEligibleEmployees}</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Completed</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{summary.employeesCompleted}</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Pending</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{summary.employeesPending}</p>
              </article>
              <article className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Completion Rate</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{summary.completionRate.toFixed(1)}%</p>
              </article>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/dashboard/billing-enrollment/open-enrollment"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                View Enrollment Progress
              </Link>
              <button
                type="button"
                disabled={isSendingReminder || pendingRecords.length === 0}
                onClick={() => void sendReminder('email', 'pending')}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send Reminder Notifications
              </button>
              <button
                type="button"
                onClick={downloadEnrollmentCsv}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Download Enrollment Report
              </button>
              <a
                href="#enrollment-progress-table"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--tenant-primary-color)] bg-white px-4 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Review Enrollment Elections
              </a>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="No open enrollment active"
              description="Once an enrollment cycle is scheduled, completion metrics and action controls will appear here."
            />
          </div>
        )}

        {reminderMessage ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{reminderMessage}</p>
        ) : null}
        {reminderError ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{reminderError}</p>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <MiniBars title="Enrollment Completion Trend" rows={analytics.completionTrend} />
        <MiniBars title="Plan Selection Breakdown" rows={analytics.planSelectionBreakdown} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <MiniBars title="Coverage Tier Distribution" rows={analytics.coverageTierDistribution} />
        <MiniBars
          title="Department Completion Rate"
          rows={analytics.departmentCompletionRates}
          suffix="%"
        />
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({ ...current, query: event.target.value }))
              }
              placeholder="Search employee, ID, department, plan, or tier"
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Enrollment Status</span>
            <select
              value={filters.enrollmentStatus}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  enrollmentStatus: event.target.value as Filters['enrollmentStatus']
                }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Admin Override">Admin Override</option>
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Department</span>
            <select
              value={filters.department}
              onChange={(event) =>
                setFilters((current) => ({ ...current, department: event.target.value }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Plan Selection</span>
            <select
              value={filters.planSelection}
              onChange={(event) =>
                setFilters((current) => ({ ...current, planSelection: event.target.value }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All plans</option>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Coverage Tier</span>
            <select
              value={filters.coverageTier}
              onChange={(event) =>
                setFilters((current) => ({ ...current, coverageTier: event.target.value }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All tiers</option>
              {coverageTiers.map((coverageTier) => (
                <option key={coverageTier} value={coverageTier}>
                  {coverageTier}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Submission Date</span>
            <input
              type="date"
              value={filters.submissionDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, submissionDate: event.target.value }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section id="enrollment-progress-table" className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Enrollment Progress Table</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Showing {filtered.length} of {records.length} employees
          </p>
        </div>

        {records.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No enrollment records"
              description="Enrollment progress records will appear when the cycle opens for employees."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No matching results for filters"
              description="Adjust your search or filter selections to find employee enrollment records."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Enrollment Status</th>
                  <th>Selected Plan</th>
                  <th>Coverage Tier</th>
                  <th>Submission Date</th>
                  <th>Last Reminder Sent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td>{record.employeeName}</td>
                    <td>{record.employeeId}</td>
                    <td>{record.department}</td>
                    <td>
                      <StatusBadge label={record.enrollmentStatus} />
                    </td>
                    <td>{record.selectedPlan}</td>
                    <td>{record.coverageTier}</td>
                    <td>{formatDate(record.submissionDate)}</td>
                    <td>{formatDate(record.lastReminderSent)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/dashboard/billing-enrollment/open-enrollment/${record.id}`}
                          className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]"
                        >
                          View Enrollment Details
                        </Link>
                        <button
                          type="button"
                          disabled={isSendingReminder || record.enrollmentStatus === 'Completed'}
                          onClick={() => void sendReminder('email', 'single', record.id)}
                          className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Send Reminder
                        </button>
                        <Link
                          href={`/dashboard/billing-enrollment/open-enrollment/${record.id}#elections`}
                          className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          Review Elections
                        </Link>
                        <button
                          type="button"
                          className="rounded-full border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        >
                          Mark Enrollment Complete
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

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reminder Notifications</h2>
          <StatusBadge label={`${pendingRecords.length} Pending`} />
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Send reminders to employees with incomplete elections through email or portal notifications.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSendingReminder || pendingRecords.length === 0}
            onClick={() => void sendReminder('email', 'pending')}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Email notification
          </button>
          <button
            type="button"
            disabled={isSendingReminder || pendingRecords.length === 0}
            onClick={() => void sendReminder('portal', 'pending')}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Portal notification
          </button>
          <button
            type="button"
            disabled={isSendingReminder || pendingRecords.length === 0}
            onClick={() => void sendReminder('email', 'pending')}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bulk reminders
          </button>
        </div>

        {pendingRecords.length === 0 ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            All employees have completed enrollment.
          </p>
        ) : null}
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Submission Snapshot</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="portal-data-table w-full border-collapse bg-white text-sm">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Plan</th>
                <th>Coverage Tier</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {records.filter((record) => record.submittedAt).slice(0, 5).map((record) => (
                <tr key={`${record.id}-snapshot`}>
                  <td>{record.employeeName}</td>
                  <td>{record.selectedPlan}</td>
                  <td>{record.coverageTier}</td>
                  <td>{formatDateTime(record.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
