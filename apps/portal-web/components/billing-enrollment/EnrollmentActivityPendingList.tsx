'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  EnrollmentErrorState,
  EnrollmentRequestRecord,
  EnrollmentRequestStatus,
  EnrollmentRequestType
} from '../../lib/enrollment-activity-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type PendingFilters = {
  query: string;
  requestType: 'all' | EnrollmentRequestType;
  status: 'all' | EnrollmentRequestStatus;
  effectiveDate: string;
  submissionDate: string;
  plan: 'all' | string;
  department: 'all' | string;
  errorState: 'all' | EnrollmentErrorState;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function EnrollmentActivityPendingList({
  embedded = false,
  requests,
  requestTypes,
  plans,
  departments
}: {
  embedded?: boolean;
  requests: EnrollmentRequestRecord[];
  requestTypes: EnrollmentRequestType[];
  plans: string[];
  departments: string[];
}) {
  const [filters, setFilters] = useState<PendingFilters>({
    query: '',
    requestType: 'all',
    status: 'all',
    effectiveDate: '',
    submissionDate: '',
    plan: 'all',
    department: 'all',
    errorState: 'all'
  });

  const filtered = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return requests.filter((request) => {
      const searchable = [
        request.employeeName,
        request.employeeId,
        request.submittedBy,
        request.planSelection,
        request.department,
        request.requestType
      ]
        .join(' ')
        .toLowerCase();

      const queryMatch = !normalizedQuery || searchable.includes(normalizedQuery);
      const requestTypeMatch =
        filters.requestType === 'all' || request.requestType === filters.requestType;
      const statusMatch = filters.status === 'all' || request.status === filters.status;
      const effectiveDateMatch =
        !filters.effectiveDate || request.effectiveDate === filters.effectiveDate;
      const submissionDateMatch =
        !filters.submissionDate || request.submissionDate === filters.submissionDate;
      const planMatch = filters.plan === 'all' || request.planSelection === filters.plan;
      const departmentMatch =
        filters.department === 'all' || request.department === filters.department;
      const errorStateMatch =
        filters.errorState === 'all' || request.errorState === filters.errorState;

      return (
        queryMatch &&
        requestTypeMatch &&
        statusMatch &&
        effectiveDateMatch &&
        submissionDateMatch &&
        planMatch &&
        departmentMatch &&
        errorStateMatch
      );
    });
  }, [filters, requests]);

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Enrollment Activity</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
            Pending Enrollments Queue
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
            Review enrollment requests that require approval, correction, or manual intervention.
          </p>
        </section>
      )}

      <section className="portal-card p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
          <label className="xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) =>
                setFilters((current) => ({ ...current, query: event.target.value }))
              }
              placeholder="Search by employee, ID, submitter, or request type"
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Request Type</span>
            <select
              value={filters.requestType}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  requestType: event.target.value as PendingFilters['requestType']
                }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All request types</option>
              {requestTypes.map((requestType) => (
                <option key={requestType} value={requestType}>
                  {requestType}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as PendingFilters['status']
                }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Needs Correction">Needs Correction</option>
              <option value="Error">Error</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Effective Date</span>
            <input
              type="date"
              value={filters.effectiveDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, effectiveDate: event.target.value }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            />
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

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Plan</span>
            <select
              value={filters.plan}
              onChange={(event) =>
                setFilters((current) => ({ ...current, plan: event.target.value }))
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
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Error State</span>
            <select
              value={filters.errorState}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  errorState: event.target.value as PendingFilters['errorState']
                }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">Any error state</option>
              <option value="None">No issues</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
            </select>
          </label>
        </div>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pending Enrollment Requests</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Showing {filtered.length} of {requests.length} records
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No pending enrollments"
              description="New enrollment requests requiring review will appear here."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No matching results"
              description="Adjust filters or search terms to find enrollment requests."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Request Type</th>
                  <th>Submission Date</th>
                  <th>Effective Date</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Plan Selection</th>
                  <th>Error / Warning</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <p className="font-semibold text-[var(--text-primary)]">{request.employeeName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{request.department}</p>
                    </td>
                    <td>{request.employeeId}</td>
                    <td>{request.requestType}</td>
                    <td>{formatDate(request.submissionDate)}</td>
                    <td>{formatDate(request.effectiveDate)}</td>
                    <td>
                      <StatusBadge label={request.status} />
                    </td>
                    <td>{request.submittedBy}</td>
                    <td>{request.planSelection}</td>
                    <td>
                      {request.errorState === 'None' ? (
                        <span className="text-xs text-[var(--text-muted)]">None</span>
                      ) : (
                        <div className="space-y-1">
                          <StatusBadge label={request.errorState} />
                          <p className="text-xs text-[var(--text-secondary)]">
                            {request.errorOrWarningIndicator ?? 'Review details'}
                          </p>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/dashboard/billing-enrollment/enrollment-activity/${request.id}`}
                          className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]"
                        >
                          Review Details
                        </Link>
                        <button
                          type="button"
                          className="rounded-full border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-300 px-2.5 py-1 text-xs font-semibold text-rose-700"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700"
                        >
                          Request Correction
                        </button>
                        <Link
                          href={`/dashboard/billing-enrollment/enrollment-activity/${request.id}#audit-trail`}
                          className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                        >
                          View Audit Trail
                        </Link>
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
