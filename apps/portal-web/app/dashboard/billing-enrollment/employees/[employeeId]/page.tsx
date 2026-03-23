import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EmptyState, StatusBadge } from '../../../../../components/portal-ui';
import { getEmployerEmployeeById } from '../../../../../lib/billing-enrollment-api';
import {
  type CoverageType
} from '../../../../../lib/employer-census-data';
import { getPortalSessionUser } from '../../../../../lib/portal-session';

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function coverageDisplay(value: CoverageType) {
  return value === 'Waived' ? 'Waived Coverage' : value;
}

const sectionLabelMap: Record<string, string> = {
  eligibility: 'Eligibility',
  dependents: 'Dependents',
  coverage: 'Coverage Management',
  history: 'Enrollment History'
};

export default async function EmployeeDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const [{ employeeId }, { section }] = await Promise.all([params, searchParams]);
  const sessionUser = await getPortalSessionUser();
  const employee = sessionUser ? await getEmployerEmployeeById(sessionUser.id, employeeId) : null;

  if (!employee) {
    notFound();
  }

  const activeSectionLabel = section ? sectionLabelMap[section] : null;

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Employee Detail</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {employee.firstName} {employee.lastName}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Employee ID {employee.employeeId} • {employee.department}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/billing-enrollment/employees" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            Back to Employees
          </Link>
          <Link href="/dashboard/billing-enrollment/enrollment/household" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Manage Dependents
          </Link>
          <Link href="/dashboard/billing-enrollment/enrollment/status" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">
            View Enrollment Workflow
          </Link>
        </div>
        {activeSectionLabel ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            Focused action: <span className="font-semibold text-[var(--text-primary)]">{activeSectionLabel}</span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Eligibility Status</p>
          <div className="mt-2">
            <StatusBadge label={employee.eligibilityStatus} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Current eligibility record for plan year 2026.</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Enrollment Status</p>
          <div className="mt-2">
            <StatusBadge label={employee.coverageStatus} />
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{coverageDisplay(employee.coverageType)} • {employee.planSelection}</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Effective Date</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatDate(employee.effectiveDate)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Coverage start date</p>
        </article>
        <article className="portal-card p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Termination Date</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatDate(employee.terminationDate)}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Only populated for terminated coverage</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Demographic Summary</h2>
          <dl className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center justify-between gap-3">
              <dt>Name</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{employee.firstName} {employee.lastName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Email</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{employee.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Title</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{employee.title}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Department</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{employee.department}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Location</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{employee.location}</dd>
            </div>
          </dl>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Billing Impact Summary</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Placeholder values for downstream billing integration.</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--text-secondary)]">Employer Contribution</span>
              <span className="font-semibold text-[var(--text-primary)]">${employee.billingImpact.monthlyEmployerContribution.toLocaleString()}/mo</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--text-secondary)]">Employee Contribution</span>
              <span className="font-semibold text-[var(--text-primary)]">${employee.billingImpact.monthlyEmployeeContribution.toLocaleString()}/mo</span>
            </div>
            <p className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm text-[var(--text-secondary)]">
              {employee.billingImpact.notes}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dependents</h2>
          {employee.dependents.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No dependents"
                description="This employee currently has no dependent coverage records."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="portal-data-table w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Relationship</th>
                    <th>Date of Birth</th>
                    <th>Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.dependents.map((dependent) => (
                    <tr key={dependent.id}>
                      <td>{dependent.firstName} {dependent.lastName}</td>
                      <td>{dependent.relationship}</td>
                      <td>{formatDate(dependent.dateOfBirth)}</td>
                      <td><StatusBadge label={dependent.coverageStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Qualifying Life Events</h2>
          {employee.lifeEvents.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No qualifying life events"
                description="No life event submissions are on file for this employee."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {employee.lifeEvents.map((lifeEvent) => (
                <li key={lifeEvent.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{lifeEvent.eventType}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{formatDate(lifeEvent.eventDate)}</p>
                    </div>
                    <StatusBadge label={lifeEvent.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="portal-card p-5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan Enrollment History</h2>
        {employee.enrollmentHistory.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No enrollment history"
              description="Enrollment changes will appear here as plan actions are processed."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Coverage Type</th>
                  <th>Status</th>
                  <th>Effective</th>
                  <th>End</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {employee.enrollmentHistory.map((historyItem) => (
                  <tr key={historyItem.id}>
                    <td>{historyItem.planName}</td>
                    <td>{coverageDisplay(historyItem.coverageType)}</td>
                    <td><StatusBadge label={historyItem.status} /></td>
                    <td>{formatDate(historyItem.effectiveDate)}</td>
                    <td>{formatDate(historyItem.endDate)}</td>
                    <td>{historyItem.source}</td>
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
