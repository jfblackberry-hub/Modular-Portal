'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { ReportCategory, ReportDefinition, ReportFilters, ReportId } from '../../lib/reports-analytics-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type Grouped = Record<ReportCategory, ReportDefinition[]>;

export function ReportsLibrary({
  embedded = false,
  groupedReports,
  initialFilters,
  tenantName
}: {
  embedded?: boolean;
  groupedReports: Grouped;
  initialFilters: ReportFilters;
  tenantName: string;
}) {
  const pathname = usePathname();
  const [selectedReport, setSelectedReport] = useState<ReportId>('employee-census');
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [runMessage, setRunMessage] = useState('');
  const reportsBasePath = pathname.startsWith('/employer/')
    ? '/employer/reports'
    : '/dashboard/billing-enrollment/reports';
  const reportHref = `${reportsBasePath}/export/${selectedReport}`;

  const selectedDefinition = useMemo(() => {
    return Object.values(groupedReports)
      .flat()
      .find((report) => report.id === selectedReport);
  }, [groupedReports, selectedReport]);

  function runReport() {
    setRunMessage(`Report run started for ${selectedDefinition?.name ?? 'selected report'} using current filters.`);
  }

  return (
    <div className="space-y-5">
      {embedded ? null : (
        <section className="portal-card p-6 sm:p-8">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Reports &amp; Analytics</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Reports Library</h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
            Generate operational exports for {tenantName} across workforce, coverage, billing, and compliance.
          </p>
        </section>
      )}

      <section className="portal-card p-5">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={runReport} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">
            Run Report
          </button>
          <Link href={`${reportHref}?format=csv`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Export Data
          </Link>
          <Link href={`${reportsBasePath}/analytics`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            View Analytics
          </Link>
          <Link href={`${reportsBasePath}/schedule`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Schedule Report
          </Link>
        </div>
        {runMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {runMessage}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Report Categories</h2>
          <div className="mt-4 space-y-4">
            {(Object.entries(groupedReports) as Array<[ReportCategory, ReportDefinition[]]>).map(([category, reports]) => (
              <section key={category}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{category}</p>
                <ul className="mt-2 space-y-2">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          selectedReport === report.id
                            ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)]'
                            : 'border-[var(--border-subtle)] bg-slate-50 hover:border-[var(--tenant-primary-color)]'
                        }`}
                      >
                        <p className="font-semibold text-[var(--text-primary)]">{report.name}</p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">{report.description}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Report Filters</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Date Range</span>
              <select value={filters.dateRange} onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value as ReportFilters['dateRange'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
                <option>Year to Date</option>
                <option>Custom</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Plan Type</span>
              <select value={filters.planType} onChange={(event) => setFilters((current) => ({ ...current, planType: event.target.value as ReportFilters['planType'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>All</option>
                <option>Gold PPO</option>
                <option>Silver HMO</option>
                <option>Bronze HDHP</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Coverage Tier</span>
              <select value={filters.coverageTier} onChange={(event) => setFilters((current) => ({ ...current, coverageTier: event.target.value as ReportFilters['coverageTier'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>All</option>
                <option>Employee Only</option>
                <option>Employee + Spouse</option>
                <option>Employee + Children</option>
                <option>Family</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Employee Status</span>
              <select value={filters.employeeStatus} onChange={(event) => setFilters((current) => ({ ...current, employeeStatus: event.target.value as ReportFilters['employeeStatus'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>All</option>
                <option>Active</option>
                <option>Terminated</option>
                <option>Waived</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Department</span>
              <select value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value as ReportFilters['department'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>All</option>
                <option>Finance</option>
                <option>Engineering</option>
                <option>People Operations</option>
                <option>Sales</option>
                <option>Operations</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Enrollment Status</span>
              <select value={filters.enrollmentStatus} onChange={(event) => setFilters((current) => ({ ...current, enrollmentStatus: event.target.value as ReportFilters['enrollmentStatus'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>All</option>
                <option>Pending</option>
                <option>Completed</option>
                <option>Needs Correction</option>
                <option>Error</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Selected Report</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedDefinition?.name ?? 'None selected'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`${reportHref}?format=csv`} className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">CSV</Link>
              <Link href={`${reportHref}?format=excel`} className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">Excel</Link>
              <Link href={`${reportHref}?format=pdf`} className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">PDF</Link>
              <StatusBadge label="Tenant Scoped" />
            </div>
          </div>
        </article>
      </section>

      {Object.values(groupedReports).flat().length === 0 ? (
        <EmptyState title="No reports available" description="Report definitions are unavailable for this tenant." />
      ) : null}
    </div>
  );
}
