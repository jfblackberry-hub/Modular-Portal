'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { EmployeeCensusRecord, WorkforceCoverageSummary } from '../../lib/employer-census-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type ListFilters = {
  query: string;
  status: 'all' | 'Active' | 'Terminated' | 'Pending Enrollment' | 'Waived';
  coverageType: 'all' | string;
  plan: 'all' | string;
  department: 'all' | string;
};

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

function buildCsv(employees: EmployeeCensusRecord[]) {
  const header = [
    'Employee Name',
    'Employee ID',
    'Status',
    'Coverage Status',
    'Coverage Type',
    'Plan Selection',
    'Dependents Count',
    'Effective Date',
    'Termination Date',
    'Department'
  ];

  const rows = employees.map((employee) => [
    `${employee.firstName} ${employee.lastName}`,
    employee.employeeId,
    employee.status,
    employee.coverageStatus,
    employee.coverageType,
    employee.planSelection,
    String(employee.dependents.length),
    employee.effectiveDate,
    employee.terminationDate ?? '',
    employee.department
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

export function EmployeeCensusList({
  embedded = false,
  employees,
  employerName,
  summary,
  coverageTypes,
  plans,
  departments
}: {
  embedded?: boolean;
  employees: EmployeeCensusRecord[];
  employerName: string;
  summary: WorkforceCoverageSummary;
  coverageTypes: string[];
  plans: string[];
  departments: string[];
}) {
  const [filters, setFilters] = useState<ListFilters>({
    query: '',
    status: 'all',
    coverageType: 'all',
    plan: 'all',
    department: 'all'
  });

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return employees.filter((employee) => {
      const searchable = [
        employee.firstName,
        employee.lastName,
        employee.employeeId,
        employee.department,
        employee.planSelection,
        employee.coverageType
      ]
        .join(' ')
        .toLowerCase();

      const queryMatch = !normalizedQuery || searchable.includes(normalizedQuery);
      const statusMatch = filters.status === 'all' || employee.status === filters.status;
      const coverageTypeMatch =
        filters.coverageType === 'all' || employee.coverageType === filters.coverageType;
      const planMatch = filters.plan === 'all' || employee.planSelection === filters.plan;
      const departmentMatch =
        filters.department === 'all' || employee.department === filters.department;

      return (
        queryMatch &&
        statusMatch &&
        coverageTypeMatch &&
        planMatch &&
        departmentMatch
      );
    });
  }, [employees, filters]);

  function handleCsvExport() {
    const csv = buildCsv(filteredEmployees);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'employee-census.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Enrollment &amp; Billing</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
            Employee Census
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
            Search and manage employee coverage records for {employerName}.
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <article className="portal-card p-4 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Eligible</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.eligibleEmployees.toLocaleString()}</p>
        </article>
        <article className="portal-card p-4 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Enrolled</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.enrolledEmployees.toLocaleString()}</p>
        </article>
        <article className="portal-card p-4 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Waived</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.waivedEmployees.toLocaleString()}</p>
        </article>
        <article className="portal-card p-4 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Dependents</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.dependentsCovered.toLocaleString()}</p>
        </article>
        <article className="portal-card p-4 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Covered Lives</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.coveredLives.toLocaleString()}</p>
        </article>
        <article className="portal-card p-4 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Coverage Rate</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.coverageRate.toFixed(1)}%</p>
        </article>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search by name, employee ID, plan, or department"
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as ListFilters['status']
                }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Terminated">Terminated</option>
              <option value="Pending Enrollment">Pending Enrollment</option>
              <option value="Waived">Waived</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Coverage Type</span>
            <select
              value={filters.coverageType}
              onChange={(event) =>
                setFilters((current) => ({ ...current, coverageType: event.target.value }))
              }
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            >
              <option value="all">All coverage types</option>
              {coverageTypes.map((coverageType) => (
                <option key={coverageType} value={coverageType}>
                  {coverageType}
                </option>
              ))}
            </select>
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
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCsvExport}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Export Census
          </button>
          <Link
            href="/dashboard/billing-enrollment/enrollment/start"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
          >
            Add Employee
          </Link>
        </div>
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Employee Census Records</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>

        {employees.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No employees found"
              description="Employee records will appear here once your census data is available."
            />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No results for current filters"
              description="Adjust search terms or filter values to find matching employee records."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Status</th>
                  <th>Coverage Status</th>
                  <th>Plan Selection</th>
                  <th>Dependents</th>
                  <th>Effective Date</th>
                  <th>Termination Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{employee.department}</p>
                    </td>
                    <td>{employee.employeeId}</td>
                    <td>
                      <StatusBadge label={employee.status} />
                    </td>
                    <td>
                      <div className="space-y-1">
                        <StatusBadge label={employee.coverageStatus} />
                        <p className="text-xs text-[var(--text-muted)]">{employee.coverageType}</p>
                      </div>
                    </td>
                    <td>{employee.planSelection}</td>
                    <td>{employee.dependents.length}</td>
                    <td>{formatDate(employee.effectiveDate)}</td>
                    <td>{formatDate(employee.terminationDate)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/dashboard/billing-enrollment/employees/${employee.id}`} className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]">
                          View Details
                        </Link>
                        <Link href={`/dashboard/billing-enrollment/employees/${employee.id}?section=eligibility`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          Edit Eligibility
                        </Link>
                        <Link href={`/dashboard/billing-enrollment/employees/${employee.id}?section=dependents`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          Manage Dependents
                        </Link>
                        <Link href={`/dashboard/billing-enrollment/employees/${employee.id}?section=coverage`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          Terminate Coverage
                        </Link>
                        <Link href={`/dashboard/billing-enrollment/employees/${employee.id}?section=history`} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          Enrollment History
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
