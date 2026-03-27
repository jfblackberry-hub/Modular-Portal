'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';

import {
  formatProviderReportFilterLabel,
  type ProviderReportChart,
  type ProviderReportChartDatum,
  type ProviderReportingFilters,
  type ProviderReportingPayload,
  type ProviderReportMetric,
  type ProviderReportTableColumn,
  type ProviderReportTone} from '../../../lib/provider-reporting';
import { PageHeader, SurfaceCard } from '../../portal-ui';

type SortState = {
  columnKey: string;
  direction: 'asc' | 'desc';
} | null;

function metricToneClass(tone: ProviderReportTone) {
  if (tone === 'critical') return 'tenant-status-chip tenant-status-chip--critical';
  if (tone === 'warning') return 'tenant-status-chip tenant-status-chip--warning';
  if (tone === 'success') return 'tenant-status-chip tenant-status-chip--success';
  return 'tenant-status-chip tenant-status-chip--info';
}

function barToneClass(tone: ProviderReportTone) {
  if (tone === 'critical') return 'bg-rose-500';
  if (tone === 'warning') return 'bg-amber-500';
  if (tone === 'success') return 'bg-emerald-500';
  return 'bg-sky-500';
}

function textToneClass(tone: ProviderReportTone) {
  if (tone === 'critical') return 'text-rose-700';
  if (tone === 'warning') return 'text-amber-700';
  if (tone === 'success') return 'text-emerald-700';
  return 'text-sky-700';
}

function formatMetricValue(value: number, format: ProviderReportChart['format']) {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  if (format === 'percent') {
    return `${Math.round(value)}%`;
  }

  return value.toLocaleString('en-US');
}

function normalizeComparableValue(value: string) {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ''));

  if (!Number.isNaN(numericValue) && value.match(/[0-9]/)) {
    return numericValue;
  }

  return value.toLowerCase();
}

function filterOptionLabel(
  options: Array<{ label: string; value: string }>,
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? formatProviderReportFilterLabel(value);
}

function fieldVisible(
  reportId: ProviderReportingFilters['reportId'],
  field:
    | 'authorizationStatus'
    | 'claimStatus'
    | 'denialReason'
    | 'payer'
    | 'serviceSetting'
    | 'status'
    | 'supervisingClinician'
    | 'therapist'
) {
  const fieldMap: Record<
    ProviderReportingFilters['reportId'],
    Set<
      | 'authorizationStatus'
      | 'claimStatus'
      | 'denialReason'
      | 'payer'
      | 'serviceSetting'
      | 'status'
      | 'supervisingClinician'
      | 'therapist'
    >
  > = {
    'patient-census': new Set(['payer', 'status', 'therapist', 'supervisingClinician']),
    'sessions-delivered': new Set(['payer', 'serviceSetting', 'status', 'therapist']),
    'authorization-utilization': new Set(['authorizationStatus', 'payer']),
    'eligibility-readiness': new Set(['payer', 'status', 'therapist']),
    'claims-revenue': new Set(['claimStatus', 'payer', 'therapist']),
    'denials-resubmissions': new Set(['claimStatus', 'denialReason', 'payer']),
    'therapist-utilization': new Set(['serviceSetting', 'status', 'therapist']),
    'supervisory-oversight': new Set(['serviceSetting', 'status', 'supervisingClinician']),
    'location-performance': new Set(['payer', 'serviceSetting', 'status']),
    'executive-business-summary': new Set(['payer', 'serviceSetting', 'status'])
  };

  return fieldMap[reportId].has(field);
}

function ChartCard({ chart }: { chart: ProviderReportChart }) {
  const maxValue = Math.max(...chart.data.map((datum) => datum.value), 1);

  return (
    <article className="rounded-[24px] border border-[var(--border-subtle)] bg-white/90 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{chart.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{chart.subtitle}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {chart.type}
        </span>
      </div>

      {chart.type === 'trend' ? (
        <div className="mt-5 grid grid-cols-6 gap-3 xl:grid-cols-12">
          {chart.data.map((datum) => (
            <div key={`${chart.id}:${datum.label}`} className="flex min-w-0 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end rounded-2xl bg-slate-100/90 p-2">
                <div
                  className={`w-full rounded-xl ${barToneClass(datum.tone)}`}
                  style={{
                    height: `${Math.max(12, (datum.value / maxValue) * 100)}%`
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {datum.label}
                </p>
                <p className={`mt-1 text-sm font-semibold ${textToneClass(datum.tone)}`}>
                  {formatMetricValue(datum.value, chart.format)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {chart.data.map((datum) => (
            <ChartRow key={`${chart.id}:${datum.label}`} chart={chart} datum={datum} maxValue={maxValue} />
          ))}
        </div>
      )}
    </article>
  );
}

function ChartRow({
  chart,
  datum,
  maxValue
}: {
  chart: ProviderReportChart;
  datum: ProviderReportChartDatum;
  maxValue: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50/90 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{datum.label}</p>
          {datum.detail ? (
            <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{datum.detail}</p>
          ) : null}
        </div>
        <p className={`shrink-0 text-sm font-semibold ${textToneClass(datum.tone)}`}>
          {formatMetricValue(datum.value, chart.format)}
        </p>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-slate-200/80">
        <div
          className={`h-2.5 rounded-full ${barToneClass(datum.tone)}`}
          style={{
            width: `${Math.max(8, (datum.value / maxValue) * 100)}%`
          }}
        />
      </div>
    </div>
  );
}

function SummaryMetricStrip({ metric }: { metric: ProviderReportMetric }) {
  return (
    <article className="rounded-[24px] border border-[var(--border-subtle)] bg-white/95 p-5 shadow-[0_20px_45px_-36px_rgba(15,23,42,0.4)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {metric.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {metric.value}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{metric.changeLabel}</p>
        </div>
        <span className={metricToneClass(metric.tone)}>{metric.label}</span>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--tenant-primary-color)]"
      >
        {options.map((option) => (
          <option key={`${label}:${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProviderReportingWorkspace({
  clinicName,
  initialFilters,
  initialPayload
}: {
  clinicName: string;
  initialFilters: ProviderReportingFilters;
  initialPayload: ProviderReportingPayload;
}) {
  const [draftFilters, setDraftFilters] = useState<ProviderReportingFilters>(initialFilters);
  const [payload, setPayload] = useState<ProviderReportingPayload>(initialPayload);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runTimestamp, setRunTimestamp] = useState(() =>
    new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  );
  const [isPending, startTransition] = useTransition();
  const [sortState, setSortState] = useState<SortState>(null);

  const reportDefinition = useMemo(
    () => payload.options.library.find((entry) => entry.id === draftFilters.reportId) ?? payload.options.library[0],
    [draftFilters.reportId, payload.options.library]
  );

  const sortedRows = useMemo(() => {
    if (!sortState) {
      return payload.report.table.rows;
    }

    return [...payload.report.table.rows].sort((left, right) => {
      const leftValue = normalizeComparableValue(left.values[sortState.columnKey] ?? '');
      const rightValue = normalizeComparableValue(right.values[sortState.columnKey] ?? '');

      if (leftValue < rightValue) {
        return sortState.direction === 'asc' ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortState.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [payload.report.table.rows, sortState]);

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
    startTransition(async () => {
      setErrorMessage(null);

      try {
        const response = await fetch('/api/provider-reporting', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(draftFilters)
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(errorPayload?.message ?? 'Unable to run report.');
        }

        const nextPayload = (await response.json()) as ProviderReportingPayload;
        setPayload(nextPayload);
        setRunTimestamp(
          new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to run report.');
      }
    });
  }

  function toggleSort(column: ProviderReportTableColumn) {
    setSortState((current) => {
      if (!current || current.columnKey !== column.key) {
        return {
          columnKey: column.key,
          direction: column.align === 'right' ? 'desc' : 'asc'
        };
      }

      return {
        columnKey: column.key,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      };
    });
  }

  const visibleSummaryLabels = [
    filterOptionLabel(payload.options.dateRanges, draftFilters.dateRange),
    filterOptionLabel(payload.options.locations, draftFilters.location),
    filterOptionLabel(payload.options.patientTypes, draftFilters.patientType)
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={clinicName}
        title="Reporting"
        description="Centralized administration can review operational and business performance across the ABA clinic organization with a warehouse-style reporting workspace built for business follow-up."
      />

      <SurfaceCard
        title="Report controls"
        description="Select a canned report, narrow the operating view, and run a business-friendly ABA clinic report without leaving the Provider experience."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="tenant-status-chip tenant-status-chip--info">
              {payload.summary.approximateRecordCounts.patients} patients
            </span>
            <span className="tenant-status-chip tenant-status-chip--success">
              {payload.summary.lookbackMonths} months of history
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto_auto]">
            <FilterSelect
              label="Canned report"
              value={draftFilters.reportId}
              onChange={(value) => updateFilter('reportId', value as ProviderReportingFilters['reportId'])}
              options={payload.options.library.map((entry) => ({
                label: entry.label,
                value: entry.id
              }))}
            />
            <FilterSelect
              label="Date range"
              value={draftFilters.dateRange}
              onChange={(value) => updateFilter('dateRange', value as ProviderReportingFilters['dateRange'])}
              options={payload.options.dateRanges}
            />
            <FilterSelect
              label="Patient type"
              value={draftFilters.patientType}
              onChange={(value) => updateFilter('patientType', value)}
              options={payload.options.patientTypes}
            />
            <FilterSelect
              label="Location"
              value={draftFilters.location}
              onChange={(value) => updateFilter('location', value)}
              options={payload.options.locations}
            />
            <div className="flex items-end">
              <button
                type="button"
                onClick={runReport}
                disabled={isPending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[var(--tenant-primary-color)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_-24px_color-mix(in_srgb,var(--tenant-primary-color)_55%,transparent)] disabled:cursor-wait disabled:opacity-80"
              >
                {isPending ? 'Running...' : 'Run report'}
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

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {fieldVisible(draftFilters.reportId, 'payer') ? (
              <FilterSelect
                label="Payer"
                value={draftFilters.payer}
                onChange={(value) => updateFilter('payer', value)}
                options={payload.options.payers}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'therapist') ? (
              <FilterSelect
                label="Therapist"
                value={draftFilters.therapist}
                onChange={(value) => updateFilter('therapist', value)}
                options={payload.options.therapists}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'supervisingClinician') ? (
              <FilterSelect
                label="Supervising clinician"
                value={draftFilters.supervisingClinician}
                onChange={(value) => updateFilter('supervisingClinician', value)}
                options={payload.options.supervisingClinicians}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'serviceSetting') ? (
              <FilterSelect
                label="Service setting"
                value={draftFilters.serviceSetting}
                onChange={(value) => updateFilter('serviceSetting', value)}
                options={payload.options.serviceSettings}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'status') ? (
              <FilterSelect
                label="Status"
                value={draftFilters.status}
                onChange={(value) => updateFilter('status', value)}
                options={payload.options.statuses}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'authorizationStatus') ? (
              <FilterSelect
                label="Authorization status"
                value={draftFilters.authorizationStatus}
                onChange={(value) => updateFilter('authorizationStatus', value)}
                options={payload.options.authorizationStatuses}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'claimStatus') ? (
              <FilterSelect
                label="Claim status"
                value={draftFilters.claimStatus}
                onChange={(value) => updateFilter('claimStatus', value)}
                options={payload.options.claimStatuses}
              />
            ) : null}
            {fieldVisible(draftFilters.reportId, 'denialReason') ? (
              <FilterSelect
                label="Denial reason"
                value={draftFilters.denialReason}
                onChange={(value) => updateFilter('denialReason', value)}
                options={payload.options.denialReasons}
              />
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {payload.report.metrics.map((metric) => (
          <SummaryMetricStrip key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <SurfaceCard title={payload.report.reportLabel} description={payload.report.description}>
            <div className="flex flex-wrap items-center gap-2">
              {visibleSummaryLabels.map((label, index) => (
                <span key={`${index}:${label}`} className="tenant-status-chip tenant-status-chip--info">
                  {label}
                </span>
              ))}
              <span className="tenant-status-chip tenant-status-chip--success">
                {payload.report.recordCount.toLocaleString('en-US')} records
              </span>
            </div>
          </SurfaceCard>

          <div className="grid gap-6 xl:grid-cols-2">
            {payload.report.charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </div>

          <SurfaceCard
            title={payload.report.table.title}
            description={payload.report.table.description}
          >
            <div className="overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-white">
              <div className="overflow-x-auto">
                <table className="portal-data-table min-w-[980px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-slate-50/85 text-left text-[var(--text-muted)]">
                      {payload.report.table.columns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleSort(column)}
                            className="inline-flex items-center gap-1 font-semibold"
                          >
                            {column.label}
                            {sortState?.columnKey === column.key ? (
                              <span aria-hidden="true">{sortState.direction === 'asc' ? '↑' : '↓'}</span>
                            ) : null}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row) => (
                      <tr key={row.id} className="border-t border-[var(--border-subtle)]">
                        {payload.report.table.columns.map((column, columnIndex) => (
                          <td
                            key={`${row.id}:${column.key}`}
                            className={`px-4 py-3 text-[var(--text-secondary)] ${column.align === 'right' ? 'text-right' : ''}`}
                          >
                            {columnIndex === 0 ? (
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
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <SurfaceCard title="Report brief" description="Context for centralized administration before sharing or exporting this report.">
            <div className="space-y-4 text-sm text-[var(--text-secondary)]">
              <div className="rounded-[22px] border border-[var(--border-subtle)] bg-slate-50/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Current report
                </p>
                <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                  {reportDefinition?.label}
                </h3>
                <p className="mt-2 leading-6">{reportDefinition?.description}</p>
              </div>

              <div className="rounded-[22px] border border-[var(--border-subtle)] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Last run
                </p>
                <p className="mt-2 font-semibold text-[var(--text-primary)]">{runTimestamp}</p>
                <p className="mt-1">{payload.report.lastRunLabel}</p>
                <p className="mt-1">{payload.report.dataFreshnessLabel}</p>
              </div>

              <div className="rounded-[22px] border border-[var(--border-subtle)] bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Warehouse scope
                </p>
                <div className="mt-3 space-y-2">
                  <p>{payload.summary.approximateRecordCounts.locations} locations</p>
                  <p>{payload.summary.approximateRecordCounts.staff} staff records</p>
                  <p>{payload.summary.approximateRecordCounts.sessions.toLocaleString('en-US')} sessions</p>
                  <p>{payload.summary.approximateRecordCounts.claims.toLocaleString('en-US')} claims</p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Definitions and notes" description="Mock-environment caveats and interpretation guidance for business users.">
            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
              {payload.report.notes.map((note) => (
                <div
                  key={note}
                  className="rounded-[22px] border border-[var(--border-subtle)] bg-white px-4 py-3"
                >
                  {note}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Operational follow-up" description="Jump straight into the provider work area that matches the report story.">
            <div className="space-y-2">
              <Link
                href="/provider/authorizations"
                className="block rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)]"
              >
                Review authorization work queue
              </Link>
              <Link
                href="/provider/eligibility"
                className="block rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)]"
              >
                Check readiness and eligibility
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
                Rebalance therapist utilization
              </Link>
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
