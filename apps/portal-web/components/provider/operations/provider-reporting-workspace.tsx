'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  buildProviderReportView,
  createDefaultProviderReportingFilters,
  getProviderReportingOptions,
  type ProviderReportingFilters
} from '../../../lib/provider-reporting';
import { PageHeader, SurfaceCard } from '../../portal-ui';

function metricToneClass(tone: 'critical' | 'info' | 'success' | 'warning') {
  if (tone === 'critical') {
    return 'tenant-status-chip tenant-status-chip--critical';
  }

  if (tone === 'warning') {
    return 'tenant-status-chip tenant-status-chip--warning';
  }

  if (tone === 'success') {
    return 'tenant-status-chip tenant-status-chip--success';
  }

  return 'tenant-status-chip tenant-status-chip--info';
}

function chartToneClass(tone: 'critical' | 'info' | 'success' | 'warning') {
  if (tone === 'critical') {
    return 'bg-rose-500/85';
  }

  if (tone === 'warning') {
    return 'bg-amber-500/85';
  }

  if (tone === 'success') {
    return 'bg-emerald-500/85';
  }

  return 'bg-sky-500/85';
}

function filterLabel(value: string) {
  if (value === 'all') {
    return 'All';
  }

  return value;
}

export function ProviderReportingWorkspace({
  clinicName
}: {
  clinicName: string;
}) {
  const options = useMemo(() => getProviderReportingOptions(), []);
  const [draftFilters, setDraftFilters] = useState<ProviderReportingFilters>(
    createDefaultProviderReportingFilters()
  );
  const [appliedFilters, setAppliedFilters] = useState<ProviderReportingFilters>(
    createDefaultProviderReportingFilters()
  );
  const [lastRunAt, setLastRunAt] = useState(() =>
    new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  );

  const reportView = useMemo(
    () => buildProviderReportView(appliedFilters),
    [appliedFilters]
  );

  function updateFilter<K extends keyof ProviderReportingFilters>(
    key: K,
    value: ProviderReportingFilters[K]
  ) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function runReport() {
    setAppliedFilters(draftFilters);
    setLastRunAt(
      new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={clinicName}
        title="Reporting"
        description="Centralized administration can review operational and business performance across the ABA clinic organization from one reporting workspace."
      />

      <SurfaceCard
        title="Report controls"
        description="Choose a canned report, adjust filters, and run a centralized clinic view without leaving the provider experience."
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,1fr))_auto_auto]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Report
            </span>
            <select
              value={draftFilters.reportId}
              onChange={(event) =>
                updateFilter('reportId', event.target.value as ProviderReportingFilters['reportId'])
              }
              className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] shadow-[0_10px_24px_-24px_rgba(15,23,42,0.35)] outline-none transition focus:border-[var(--tenant-primary-color)]"
            >
              {options.reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Date range
            </span>
            <select
              value={draftFilters.dateRange}
              onChange={(event) =>
                updateFilter(
                  'dateRange',
                  event.target.value as ProviderReportingFilters['dateRange']
                )
              }
              className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--tenant-primary-color)]"
            >
              {options.dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Patient type
            </span>
            <select
              value={draftFilters.patientType}
              onChange={(event) => updateFilter('patientType', event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--tenant-primary-color)]"
            >
              {options.patientTypes.map((value) => (
                <option key={value} value={value}>
                  {filterLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Location
            </span>
            <select
              value={draftFilters.location}
              onChange={(event) => updateFilter('location', event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--tenant-primary-color)]"
            >
              {options.locations.map((value) => (
                <option key={value} value={value}>
                  {filterLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Payer
            </span>
            <select
              value={draftFilters.payer}
              onChange={(event) => updateFilter('payer', event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--tenant-primary-color)]"
            >
              {options.payers.map((value) => (
                <option key={value} value={value}>
                  {filterLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Therapist / clinician
            </span>
            <select
              value={draftFilters.clinician}
              onChange={(event) => updateFilter('clinician', event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--tenant-primary-color)]"
            >
              {options.clinicians.map((value) => (
                <option key={value} value={value}>
                  {filterLabel(value)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={runReport}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--tenant-primary-color)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_-24px_color-mix(in_srgb,var(--tenant-primary-color)_55%,transparent)]"
            >
              Run report
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Export
            </button>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reportView.metrics.map((metric) => (
              <SurfaceCard
                key={metric.label}
                title={metric.label}
                description={metric.changeLabel}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                    {metric.value}
                  </p>
                  <span className={metricToneClass(metric.tone)}>{metric.label}</span>
                </div>
              </SurfaceCard>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <SurfaceCard title={reportView.reportLabel} description={reportView.description}>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      Chart view
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {reportView.chartCaption}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    Last run {lastRunAt}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {reportView.chartPoints.map((point) => (
                    <div
                      key={`${reportView.reportId}:${point.label}`}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                          {point.label}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {point.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-3 h-2.5 rounded-full bg-slate-200/75">
                        <div
                          className={`h-2.5 rounded-full ${chartToneClass(point.tone)}`}
                          style={{
                            width: `${Math.max(
                              10,
                              Math.min(
                                100,
                                (point.value /
                                  Math.max(
                                    ...reportView.chartPoints.map((entry) => entry.value),
                                    1
                                  )) *
                                  100
                              )
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Report notes" description="Definitions and context for the current report selection.">
              <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50/75 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Current selection
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="tenant-status-chip tenant-status-chip--info">
                      {options.reports.find((report) => report.id === appliedFilters.reportId)?.label}
                    </span>
                    <span className="tenant-status-chip tenant-status-chip--info">
                      {options.dateRanges.find((range) => range.value === appliedFilters.dateRange)?.label}
                    </span>
                    <span className="tenant-status-chip tenant-status-chip--info">
                      {filterLabel(appliedFilters.patientType)}
                    </span>
                    <span className="tenant-status-chip tenant-status-chip--info">
                      {filterLabel(appliedFilters.location)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {reportView.notes.map((note) => (
                    <div
                      key={note}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3"
                    >
                      {note}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-slate-50/55 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Future extension
                  </p>
                  <p className="mt-2">
                    This workspace is ready for scheduled exports, saved views, and deeper cross-location reporting without changing the Provider Tenant model.
                  </p>
                </div>
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard title="Report results" description="Business-friendly tabular detail for follow-up, export, and leadership review.">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
              <table className="portal-data-table min-w-[940px] w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    {reportView.tableColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-4 py-3 font-medium ${column.align === 'right' ? 'text-right' : ''}`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportView.tableRows.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--border-subtle)]">
                      {reportView.tableColumns.map((column) => (
                        <td
                          key={`${row.id}:${column.key}`}
                          className={`px-4 py-3 text-[var(--text-secondary)] ${column.align === 'right' ? 'text-right' : ''}`}
                        >
                          {column.key === reportView.tableColumns[0]?.key ? (
                            <span className="font-semibold text-[var(--text-primary)]">
                              {row.values[column.key]}
                            </span>
                          ) : (
                            row.values[column.key]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <SurfaceCard title="How to use this screen" description="A quick guide for centralized clinic administration.">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              <p>Pick a canned report, tighten the filters, and rerun to focus on a specific location, payer lane, or clinician.</p>
              <p>Use the KPI band for fast executive readout, then move into the table for follow-up and staffing decisions.</p>
              <p>When a report exposes risk, jump back into the matching operational workspace from the provider navigation.</p>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Fast links" description="Open the operational workspace that matches the story in the report.">
            <div className="space-y-2">
              <Link
                href="/provider/authorizations"
                className="block rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)]"
              >
                Review authorization work queue
              </Link>
              <Link
                href="/provider/claims"
                className="block rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)]"
              >
                Open claims and billing
              </Link>
              <Link
                href="/provider/utilization"
                className="block rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)]"
              >
                Rebalance utilization
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
