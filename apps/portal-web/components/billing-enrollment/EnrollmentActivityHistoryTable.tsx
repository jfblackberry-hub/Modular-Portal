'use client';

import type { EnrollmentRequestRecord } from '../../lib/enrollment-activity-data';
import { EmptyState, StatusBadge } from '../portal-ui';

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

export function EnrollmentActivityHistoryTable({
  requests
}: {
  requests: EnrollmentRequestRecord[];
}) {
  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Enrollment Activity</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Enrollment History
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Review processed enrollment actions and outcomes across your employee population.
        </p>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Processed Enrollment Requests</h2>
          <p className="text-sm text-[var(--text-secondary)]">{requests.length} records</p>
        </div>

        {requests.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No enrollment history"
              description="Processed enrollment requests will appear here once activity is recorded."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Request Type</th>
                  <th>Submitted Date</th>
                  <th>Processed Date</th>
                  <th>Effective Date</th>
                  <th>Final Status</th>
                  <th>Processed By</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.employeeName}</td>
                    <td>{request.requestType}</td>
                    <td>{formatDate(request.submissionDate)}</td>
                    <td>{formatDate(request.processedDate)}</td>
                    <td>{formatDate(request.effectiveDate)}</td>
                    <td>
                      <StatusBadge label={request.status} />
                    </td>
                    <td>{request.processedBy ?? 'System'}</td>
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
