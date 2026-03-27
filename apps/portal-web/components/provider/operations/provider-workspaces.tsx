'use client';

import type {
  ProviderOperationsAuthorizationRecord,
  ProviderOperationsClaimRecord,
  ProviderOperationsDashboardContract,
  ProviderOperationsSessionRecord,
  ProviderOperationsUtilizationRecord
} from '@payer-portal/api-contracts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { ResourceCalendarMoveRequest, ResourceCalendarWeek } from '../../../lib/provider-resource-calendar';
import {
  buildResourceCalendarWeeks,
  moveBookedResourceCalendarSlot,
  RESOURCE_CALENDAR_SLOT_LABELS
} from '../../../lib/provider-resource-calendar';
import { PageHeader, SurfaceCard } from '../../portal-ui';
import { ProviderWorkflowActionButton } from './provider-workflow-action-button';

function toneClass(status: string) {
  if (/denied|expired|open_slot|at_risk|pending_resubmission/i.test(status)) {
    return 'tenant-status-chip tenant-status-chip--critical';
  }

  if (/due_soon|low_visits|pending|in_review|documentation_needed|cancelled/i.test(status)) {
    return 'tenant-status-chip tenant-status-chip--warning';
  }

  return 'tenant-status-chip tenant-status-chip--success';
}

function utilizationSeverity(percent: number) {
  if (percent > 95) {
    return 'critical';
  }

  if (percent >= 75) {
    return 'success';
  }

  if (percent >= 50) {
    return 'warning';
  }

  return 'critical';
}

function utilizationChipClass(percent: number) {
  const severity = utilizationSeverity(percent);

  if (severity === 'success') {
    return 'tenant-status-chip tenant-status-chip--success';
  }

  if (severity === 'warning') {
    return 'tenant-status-chip tenant-status-chip--warning';
  }

  return 'tenant-status-chip tenant-status-chip--critical';
}

function utilizationBarClass(percent: number) {
  const severity = utilizationSeverity(percent);

  if (severity === 'success') {
    return 'bg-emerald-500';
  }

  if (severity === 'warning') {
    return 'bg-amber-500';
  }

  return 'bg-rose-500';
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ');
}

function workspaceHref(path: string, filter: string, selected?: string | null, selectedKey = 'patient') {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') {
    params.set('filter', filter);
  }
  if (selected) {
    params.set(selectedKey, selected);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function workspaceHrefWithParams(
  path: string,
  paramsInput: Record<string, string | null | undefined>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(paramsInput)) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function FilterRow({
  basePath,
  filters,
  selected
}: {
  basePath: string;
  filters: Array<{ id: string; label: string }>;
  selected: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = selected === filter.id;
        return (
          <Link
            key={filter.id}
            href={workspaceHref(basePath, filter.id)}
            className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? 'bg-[var(--tenant-primary-color)] !text-white'
                : 'border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]'
            }`}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}

function WorkspaceFrame({
  title,
  description,
  clinicName,
  filters,
  basePath,
  selectedFilter,
  children,
  sidePanel
}: {
  title: string;
  description: string;
  clinicName: string;
  filters: Array<{ id: string; label: string }>;
  basePath: string;
  selectedFilter: string;
  children: React.ReactNode;
  sidePanel?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={clinicName} title={title} description={description} />
      <SurfaceCard title="Filter work" description="Keep the queue tight and move through the highest-value tasks first.">
        <FilterRow basePath={basePath} filters={filters} selected={selectedFilter} />
      </SurfaceCard>
      <section className={`grid gap-6 ${sidePanel ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : ''}`}>
        <div className="min-w-0 space-y-6">{children}</div>
        {sidePanel ? <div className="space-y-6">{sidePanel}</div> : null}
      </section>
    </div>
  );
}

function SchedulingGrid({ rows }: { rows: ProviderOperationsSessionRecord[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
      <table className="portal-data-table min-w-[1040px] w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="px-4 py-3 font-medium">Therapist / Time</th>
            <th className="px-4 py-3 font-medium">Child / Case</th>
            <th className="px-4 py-3 font-medium">Setting</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Flags</th>
            <th className="px-4 py-3 font-medium">Next action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border-subtle)] align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.therapistName}</p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {row.startTime} - {row.endTime}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.supervisingClinicianName}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.patientName}</p>
                <p className="mt-1 text-[var(--text-secondary)]">{row.caseName}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.organizationUnitName}</p>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)] capitalize">{row.setting}</td>
              <td className="px-4 py-3">
                <span className={toneClass(row.status)}>{formatStatus(row.status)}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {row.issueFlags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-[var(--text-secondary)]">{row.nextAction}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-[var(--tenant-primary-color)]"
                  >
                    {row.status === 'open_slot' ? 'Fill open slot' : 'Review session'}
                  </button>
                  {row.issueFlags.some((flag) => /eligibility/i.test(flag)) ? (
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
                    >
                      Run eligibility
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuthorizationTable({ rows }: { rows: ProviderOperationsAuthorizationRecord[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
      <table className="portal-data-table min-w-[1040px] w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="px-4 py-3 font-medium">Child / Case</th>
            <th className="px-4 py-3 font-medium">Payer</th>
            <th className="px-4 py-3 font-medium">Assigned team</th>
            <th className="px-4 py-3 font-medium">Window</th>
            <th className="px-4 py-3 font-medium">Visits remaining</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border-subtle)] align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.patientName}</p>
                <p className="mt-1 text-[var(--text-secondary)]">{row.caseName}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.organizationUnitName}</p>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.payerName}</td>
              <td className="px-4 py-3">
                <p className="text-[var(--text-primary)]">{row.therapistName}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.supervisingClinicianName}</p>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {row.startDate}
                <div className="text-xs text-[var(--text-muted)]">through {row.endDate}</div>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.remainingVisits}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.upcomingScheduledSessions} upcoming sessions</p>
              </td>
              <td className="px-4 py-3">
                <span className={toneClass(row.status)}>{formatStatus(row.status)}</span>
              </td>
              <td className="px-4 py-3">
                <p className="text-[var(--text-secondary)]">{row.followUpStatus}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.nextAction}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UtilizationTable({ rows }: { rows: ProviderOperationsUtilizationRecord[] }) {
  const searchParams = useSearchParams();
  const selectedResource = searchParams.get('resource');
  const selectedFilter = searchParams.get('filter') ?? 'all';

  return (
    <div className="max-h-[32rem] overflow-auto rounded-2xl border border-[var(--border-subtle)] bg-white">
      <table className="portal-data-table min-w-[980px] w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="px-4 py-3 font-medium">Therapist</th>
            <th className="px-4 py-3 font-medium">Organization Unit</th>
            <th className="px-4 py-3 font-medium">Capacity</th>
            <th className="px-4 py-3 font-medium">Utilization</th>
            <th className="px-4 py-3 font-medium">Coverage gaps</th>
            <th className="px-4 py-3 font-medium">At-risk sessions</th>
            <th className="px-4 py-3 font-medium">Next action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border-subtle)]">
              <td className="px-4 py-3">
                <Link
                  href={workspaceHrefWithParams('/provider/utilization', {
                    filter: selectedFilter === 'all' ? null : selectedFilter,
                    resource: row.id
                  })}
                  className={`font-semibold hover:text-[var(--tenant-primary-color)] ${
                    selectedResource === row.id
                      ? 'text-[var(--tenant-primary-color)]'
                      : 'text-[var(--text-primary)]'
                  }`}
                >
                  {row.therapistName}
                </Link>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.roleLabel}</p>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.organizationUnitName}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">
                {row.scheduledSessions}/{row.weeklyCapacity} sessions
              </td>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[var(--text-primary)]">{row.utilizationPercent}%</span>
                    <span className={utilizationChipClass(row.utilizationPercent)}>
                      {row.utilizationPercent > 95
                        ? 'overloaded'
                        : row.utilizationPercent >= 75
                          ? 'on target'
                          : row.utilizationPercent >= 50
                            ? 'watch'
                            : 'under target'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${utilizationBarClass(row.utilizationPercent)}`}
                      style={{ width: `${Math.min(row.utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.openCoverageGaps}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.atRiskSessions}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.nextAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceCalendarView({ row }: { row: ProviderOperationsUtilizationRecord }) {
  const [weeks, setWeeks] = useState<ResourceCalendarWeek[]>(() => buildResourceCalendarWeeks(row));
  const [draggingSlot, setDraggingSlot] = useState<{ dateKey: string; slotLabel: string } | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'saving' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadCalendar() {
      setSaveState('loading');
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/provider-operations/resource-calendar/${encodeURIComponent(row.id)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load provider availability.');
        }

        const payload = (await response.json()) as { weeks?: ResourceCalendarWeek[] };

        if (!cancelled) {
          setWeeks(payload.weeks ?? buildResourceCalendarWeeks(row));
          setSaveState('idle');
        }
      } catch (error) {
        if (cancelled || controller.signal.aborted) {
          return;
        }

        setWeeks(buildResourceCalendarWeeks(row));
        setSaveState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load provider availability.');
      }
    }

    void loadCalendar();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [row]);

  async function persistMove(move: ResourceCalendarMoveRequest, priorWeeks: ResourceCalendarWeek[]) {
    setSaveState('saving');
    setErrorMessage(null);
    setWeeks((currentWeeks) => moveBookedResourceCalendarSlot(currentWeeks, move));

    try {
      const response = await fetch(
        `/api/provider-operations/resource-calendar/${encodeURIComponent(row.id)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(move)
        }
      );

      const payload = (await response.json()) as { weeks?: ResourceCalendarWeek[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? 'Unable to move the scheduled session.');
      }

      setWeeks(payload.weeks ?? priorWeeks);
      setSaveState('idle');
    } catch (error) {
      setWeeks(priorWeeks);
      setSaveState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to move the scheduled session.'
      );
    }
  }

  return (
    <SurfaceCard
      title={`${row.therapistName} availability`}
      description="Next 4 weeks of booked, open, and unavailable blocks for this resource."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm">
          <p className="text-[var(--text-secondary)]">
            Drag a booked session into an open slot to rebalance this therapist&apos;s next 4 weeks.
          </p>
          <span className={saveState === 'saving' ? 'tenant-status-chip tenant-status-chip--warning' : 'tenant-status-chip tenant-status-chip--info'}>
            {saveState === 'saving'
              ? 'Saving move...'
              : saveState === 'loading'
                ? 'Loading...'
                : saveState === 'error'
                  ? 'Needs review'
                  : 'Live schedule'}
          </span>
        </div>
        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}
        {weeks.map((week) => (
          <section
            key={week.label}
            className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-white shadow-[0_10px_24px_-22px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-slate-50/55 px-4 py-2.5">
              <h3 className="text-sm font-semibold tracking-[0.01em] text-[var(--text-primary)]">
                {week.label}
              </h3>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Open
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-[var(--tenant-primary-color)]" />
                  Booked
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Blocked
                </span>
              </div>
            </div>
            <div className="max-h-[22rem] overflow-auto">
              <div className="min-w-[840px]">
                <div className="sticky top-0 z-10 grid grid-cols-[64px_repeat(5,minmax(150px,1fr))] border-b border-[var(--border-subtle)] bg-slate-50/95 backdrop-blur-sm">
                  <div className="border-r border-[var(--border-subtle)] px-2.5 py-2" />
                  {week.days.map((day) => (
                    <div
                      key={day.dateKey}
                      className="border-r border-[var(--border-subtle)] px-2.5 py-2 last:border-r-0"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {day.dayLabel}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                        {day.shortDate}
                      </p>
                    </div>
                  ))}
                </div>

                {RESOURCE_CALENDAR_SLOT_LABELS.map((slotLabel, slotIndex) => (
                  <div
                    key={`${week.label}:${slotLabel}`}
                    className="grid grid-cols-[64px_repeat(5,minmax(150px,1fr))] border-b border-[var(--border-subtle)] last:border-b-0"
                  >
                    <div className="border-r border-[var(--border-subtle)] bg-slate-50/35 px-2.5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                      {slotLabel}
                    </div>
                    {week.days.map((day) => {
                      const slot = day.slots[slotIndex];
                      const isDropTarget = slot.status === 'open';
                      const isDraggingSource =
                        draggingSlot?.dateKey === day.dateKey &&
                        draggingSlot?.slotLabel === slot.label;

                      return (
                        <button
                          key={`${day.dateKey}:${slot.label}`}
                          type="button"
                          draggable={slot.status === 'booked' && saveState !== 'saving'}
                          onDragStart={(event) => {
                            if (slot.status !== 'booked') {
                              return;
                            }

                            const move = {
                              sourceDate: day.dateKey,
                              sourceLabel: slot.label
                            };

                            setDraggingSlot({
                              dateKey: move.sourceDate,
                              slotLabel: move.sourceLabel
                            });
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('application/json', JSON.stringify(move));
                          }}
                          onDragEnd={() => {
                            setDraggingSlot(null);
                          }}
                          onDragOver={(event) => {
                            if (!draggingSlot || !isDropTarget || saveState === 'saving') {
                              return;
                            }

                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(event) => {
                            if (!draggingSlot || !isDropTarget || saveState === 'saving') {
                              return;
                            }

                            event.preventDefault();

                            const move = {
                              sourceDate: draggingSlot.dateKey,
                              sourceLabel: draggingSlot.slotLabel,
                              targetDate: day.dateKey,
                              targetLabel: slot.label
                            } satisfies ResourceCalendarMoveRequest;

                            const priorWeeks = weeks;

                            setDraggingSlot(null);
                            void persistMove(move, priorWeeks);
                          }}
                          className={`border-r border-[var(--border-subtle)] px-1 py-1 text-left transition last:border-r-0 ${
                            isDropTarget ? 'hover:bg-emerald-50/30' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div
                            className={`flex min-h-[60px] flex-col justify-between rounded-sm border px-2 py-1.5 ${
                              slot.status === 'booked'
                                ? 'border-[color-mix(in_srgb,var(--tenant-primary-color)_28%,white)] border-l-[3px] bg-[color-mix(in_srgb,var(--tenant-primary-soft-color)_72%,white)] text-[var(--tenant-primary-color)]'
                                : slot.status === 'blocked'
                                  ? 'border-rose-200 border-l-[3px] bg-rose-50/90 text-rose-700'
                                  : 'border-emerald-200 border-l-[3px] border-dashed bg-emerald-50/85 text-emerald-700'
                            } ${isDraggingSource ? 'opacity-60' : ''}`}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] opacity-80">
                              {slot.detail}
                            </p>
                            <div className="space-y-0.5">
                              <p className="text-[12px] font-semibold leading-tight">
                                {slot.appointmentTitle ?? slot.label}
                              </p>
                              <p className="text-[10px] opacity-80">{slot.label}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </SurfaceCard>
  );
}

function ClaimsTable({ rows }: { rows: ProviderOperationsClaimRecord[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
      <table className="portal-data-table min-w-[1080px] w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="px-4 py-3 font-medium">Claim</th>
            <th className="px-4 py-3 font-medium">Child / Case</th>
            <th className="px-4 py-3 font-medium">Therapist</th>
            <th className="px-4 py-3 font-medium">DOS</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Denial / next step</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--border-subtle)] align-top">
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.id.toUpperCase()}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{row.organizationUnitName}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.patientName}</p>
                <p className="mt-1 text-[var(--text-secondary)]">{row.caseName}</p>
              </td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.therapistName}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{row.dateOfService}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">${row.amount.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={toneClass(row.status)}>{formatStatus(row.status)}</span>
              </td>
              <td className="px-4 py-3">
                <p className="text-[var(--text-secondary)]">{row.denialReason ?? row.nextAction}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {row.resubmissionStatus ?? `Age ${row.ageInDays} days`}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type PatientRecord = {
  id: string;
  patientName: string;
  caseName: string;
  organizationUnitName: string;
  therapists: string[];
  upcomingSessions: ProviderOperationsSessionRecord[];
  authorizations: ProviderOperationsAuthorizationRecord[];
  claims: ProviderOperationsClaimRecord[];
  readinessIssues: string[];
};

function buildPatientRecords(dashboard: ProviderOperationsDashboardContract): PatientRecord[] {
  const records = new Map<string, PatientRecord>();

  for (const session of dashboard.scheduling.sessions) {
    const key = `${session.patientName}:${session.caseName}`;
    const current =
      records.get(key) ??
      {
        id: key,
        patientName: session.patientName,
        caseName: session.caseName,
        organizationUnitName: session.organizationUnitName,
        therapists: [],
        upcomingSessions: [],
        authorizations: [],
        claims: [],
        readinessIssues: []
      };
    if (!current.therapists.includes(session.therapistName)) {
      current.therapists.push(session.therapistName);
    }
    current.upcomingSessions.push(session);
    current.readinessIssues.push(...session.issueFlags);
    records.set(key, current);
  }

  for (const authorization of dashboard.authorizations.authorizations) {
    const key = `${authorization.patientName}:${authorization.caseName}`;
    const current = records.get(key);
    if (current) {
      current.authorizations.push(authorization);
      records.set(key, current);
    }
  }

  for (const claim of dashboard.claims.claims) {
    const key = `${claim.patientName}:${claim.caseName}`;
    const current = records.get(key);
    if (current) {
      current.claims.push(claim);
      records.set(key, current);
    }
  }

  return [...records.values()].sort((left, right) => left.patientName.localeCompare(right.patientName));
}

function SchedulingWorkspacePanel({ rows }: { rows: ProviderOperationsSessionRecord[] }) {
  const atRisk = rows.filter((row) => row.status === 'at_risk' || row.status === 'documentation_needed');
  const recovery = rows.filter((row) => row.status === 'open_slot' || row.issueFlags.some((flag) => /eligibility/i.test(flag)));

  return (
    <>
      <SurfaceCard title="At risk today" description="Sessions needing intervention before the family arrives.">
        <div className="space-y-3">
          {atRisk.map((row) => (
            <article key={row.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="font-semibold text-[var(--text-primary)]">{row.patientName}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.startTime} · {row.therapistName}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{row.nextAction}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>
      <SurfaceCard title="Recovery actions" description="Fast actions to protect the day’s schedule.">
        <div className="space-y-2">
          {recovery.map((row) => (
            <button
              key={row.id}
              type="button"
              className="block w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-left text-sm text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)]"
            >
              <span className="block font-semibold text-[var(--text-primary)]">{row.patientName}</span>
              <span className="mt-1 block">{row.nextAction}</span>
            </button>
          ))}
        </div>
      </SurfaceCard>
    </>
  );
}

export function ProviderSchedulingWorkspace({
  clinicName,
  dashboard
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
}) {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'all';
  const rows = dashboard.scheduling.sessions.filter((row) => {
    if (filter === 'open_slot') return row.status === 'open_slot';
    if (filter === 'cancellations') return row.status === 'cancelled' || row.issueFlags.some((flag) => /cancel/i.test(flag));
    if (filter === 'at_risk') return row.status === 'at_risk' || row.status === 'documentation_needed';
    if (filter === 'eligibility_missing') return row.issueFlags.some((flag) => /eligibility/i.test(flag));
    return true;
  });

  return (
    <WorkspaceFrame
      title="Scheduling"
      description="Run the ABA day from one place: therapist time grid, session readiness, and same-day recovery work."
      clinicName={clinicName}
      basePath="/provider/scheduling"
      selectedFilter={filter}
      filters={[
        { id: 'all', label: 'All sessions' },
        { id: 'at_risk', label: 'At risk today' },
        { id: 'open_slot', label: 'Open slots' },
        { id: 'cancellations', label: 'Cancellations' },
        { id: 'eligibility_missing', label: 'Missing eligibility' }
      ]}
      sidePanel={<SchedulingWorkspacePanel rows={rows} />}
    >
      <SurfaceCard title="Therapist schedule grid" description="Follow the day by therapist, time, and readiness status.">
        <SchedulingGrid rows={rows} />
      </SurfaceCard>
    </WorkspaceFrame>
  );
}

export function ProviderAuthorizationsWorkspace({
  clinicName,
  dashboard
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
}) {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'due_soon';
  const rows = dashboard.authorizations.authorizations.filter((row) => {
    if (filter === 'due_soon') return row.status === 'due_soon';
    if (filter === 'expired') return row.status === 'expired';
    if (filter === 'low_visits') return row.status === 'low_visits' || row.remainingVisits <= 4;
    if (filter === 'pending') return row.status === 'pending';
    if (filter === 'all') return true;
    return row.status !== 'active';
  });
  const expiredScheduled = dashboard.authorizations.authorizations.filter(
    (row) => row.status === 'expired' && row.upcomingScheduledSessions > 0
  );

  return (
    <WorkspaceFrame
      title="Authorizations"
      description="Stay ahead of visit pressure, expiring auths, and scheduled sessions that could break next week."
      clinicName={clinicName}
      basePath="/provider/authorizations"
      selectedFilter={filter}
      filters={[
        { id: 'needs_attention', label: 'Needs attention' },
        { id: 'due_soon', label: 'Coming due' },
        { id: 'expired', label: 'Expired but scheduled' },
        { id: 'low_visits', label: 'Low visits' },
        { id: 'all', label: 'All auths' }
      ]}
      sidePanel={
        <>
          <SurfaceCard title="Expired but scheduled" description="These children still have sessions on the books.">
            <div className="space-y-3">
              {expiredScheduled.map((row) => (
                <article key={row.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[var(--text-primary)]">{row.patientName}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.upcomingScheduledSessions} sessions impacted</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{row.nextAction}</p>
                </article>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard title="Next moves" description="Push the highest-value follow-up first.">
            <div className="flex flex-wrap gap-2">
              <ProviderWorkflowActionButton
                label="Create authorization"
                tone="primary"
                request={{
                  actionType: 'authorization_update',
                  capabilityId: 'provider_operations',
                  widgetId: 'authorizations',
                  targetType: 'authorization',
                  targetId: 'authorization-workspace',
                  targetLabel: 'Authorization workspace',
                  reason: 'Provider user started a new authorization from the authorizations workspace.'
                }}
              />
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Upload documents
              </button>
            </div>
          </SurfaceCard>
        </>
      }
    >
      <SurfaceCard title="Authorization queue" description="Track visits remaining, expiration windows, and impacted sessions.">
        <AuthorizationTable rows={rows} />
      </SurfaceCard>
    </WorkspaceFrame>
  );
}

export function ProviderUtilizationWorkspace({
  clinicName,
  dashboard
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
}) {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'all';
  const resource = searchParams.get('resource');
  const rows = dashboard.utilization.therapists.filter((row) => {
    if (filter === 'overloaded') return row.utilizationPercent > 95;
    if (filter === 'underutilized') return row.utilizationPercent < 70;
    if (filter === 'coverage_gaps') return row.openCoverageGaps > 0;
    return true;
  });
  const selectedResource = rows.find((row) => row.id === resource) ?? rows[0] ?? null;

  return (
    <WorkspaceFrame
      title="Utilization"
      description="Balance therapist capacity, find fill opportunities, and spot overloaded schedules before they cascade into missed care."
      clinicName={clinicName}
      basePath="/provider/utilization"
      selectedFilter={filter}
      filters={[
        { id: 'all', label: 'All therapists' },
        { id: 'overloaded', label: 'Overloaded' },
        { id: 'underutilized', label: 'Underutilized' },
        { id: 'coverage_gaps', label: 'Coverage gaps' }
      ]}
      sidePanel={
        <>
          <SurfaceCard title="Capacity watch" description="Leadership view of where to rebalance the week.">
            <div className="space-y-3">
              {rows.slice(0, 5).map((row) => (
                <article key={row.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={workspaceHrefWithParams('/provider/utilization', {
                        filter: filter === 'all' ? null : filter,
                        resource: row.id
                      })}
                      className={`font-semibold hover:text-[var(--tenant-primary-color)] ${
                        selectedResource?.id === row.id
                          ? 'text-[var(--tenant-primary-color)]'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {row.therapistName}
                    </Link>
                    <span className={utilizationChipClass(row.utilizationPercent)}>{row.utilizationPercent}%</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{row.nextAction}</p>
                </article>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard title="Quick moves" description="Use these first to rebalance the day.">
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>Review open gaps and redirect coverage where demand is spiking.</p>
              <p>Use underutilized therapists to absorb same-day cancellation fallout.</p>
              <p>Move supervision check-ins earlier when clinicians are over threshold.</p>
            </div>
          </SurfaceCard>
        </>
      }
    >
      <SurfaceCard title="Therapist capacity view" description="Compare scheduled sessions to weekly capacity across the active organization unit.">
        <UtilizationTable rows={rows} />
      </SurfaceCard>
      {selectedResource ? <ResourceCalendarView row={selectedResource} /> : null}
    </WorkspaceFrame>
  );
}

export function ProviderEligibilityWorkspace({
  clinicName,
  dashboard
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
}) {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'priority';
  const rows = dashboard.scheduling.sessions.filter((row) => {
    const hasEligibilityIssue = row.issueFlags.some((flag) => /eligibility|coverage/i.test(flag));
    if (filter === 'priority') return hasEligibilityIssue || row.status === 'at_risk';
    if (filter === 'home') return hasEligibilityIssue && row.setting === 'home';
    if (filter === 'school') return hasEligibilityIssue && row.setting === 'school';
    if (filter === 'all') return true;
    return hasEligibilityIssue;
  });

  return (
    <WorkspaceFrame
      title="Eligibility"
      description="Verify today’s sessions first, clear coverage blockers, and prevent non-billable visits before staff arrive."
      clinicName={clinicName}
      basePath="/provider/eligibility"
      selectedFilter={filter}
      filters={[
        { id: 'priority', label: 'Today first' },
        { id: 'missing', label: 'Missing verification' },
        { id: 'home', label: 'Home sessions' },
        { id: 'school', label: 'School sessions' },
        { id: 'all', label: 'All sessions' }
      ]}
      sidePanel={
        <SurfaceCard title="Quick eligibility checks" description="Move the highest-risk sessions first.">
          <div className="space-y-3">
            {rows.slice(0, 5).map((row) => (
              <article key={row.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                <p className="font-semibold text-[var(--text-primary)]">{row.patientName}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.startTime} · {row.setting}</p>
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Start eligibility check
                </button>
              </article>
            ))}
          </div>
        </SurfaceCard>
      }
    >
      <SurfaceCard title="Eligibility queue" description="Keep today’s sessions billable and avoid family-facing surprises.">
        <SchedulingGrid rows={rows} />
      </SurfaceCard>
    </WorkspaceFrame>
  );
}

export function ProviderClaimsBillingWorkspace({
  clinicName,
  dashboard
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
}) {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'denied';
  const rows = dashboard.claims.claims.filter((row) => {
    if (filter === 'submitted') return row.status === 'submitted';
    if (filter === 'pending') return row.status === 'submitted' || row.status === 'in_review';
    if (filter === 'resubmission') return row.status === 'pending_resubmission' || row.status === 'resubmitted';
    if (filter === 'at_risk') return row.status === 'denied' || row.status === 'pending_resubmission';
    if (filter === 'all') return true;
    return row.status === 'denied';
  });

  return (
    <WorkspaceFrame
      title="Claims & Billing"
      description="Work denials, unblock resubmissions, and move revenue-impacting items without bouncing back to the dashboard."
      clinicName={clinicName}
      basePath="/provider/claims"
      selectedFilter={filter}
      filters={[
        { id: 'denied', label: 'Denied claims' },
        { id: 'resubmission', label: 'Resubmissions' },
        { id: 'pending', label: 'In review' },
        { id: 'submitted', label: 'Submitted' },
        { id: 'all', label: 'All claims' }
      ]}
      sidePanel={
        <>
          <SurfaceCard title="Resolution panel" description="Start with the biggest unblockers.">
            <div className="space-y-3">
              {dashboard.claims.denialReasons.map((entry) => (
                <article key={entry.reason} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[var(--text-primary)]">{entry.reason}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {entry.count} claims · ${entry.amountAtRisk.toLocaleString()} at risk
                  </p>
                </article>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard title="Resubmission workflow" description="Keep correction work moving.">
            <div className="flex flex-wrap gap-2">
              <ProviderWorkflowActionButton
                label="Start resubmission"
                tone="primary"
                request={{
                  actionType: 'claim_resubmission',
                  capabilityId: 'provider_operations',
                  widgetId: 'claims',
                  targetType: 'claim',
                  targetId: rows[0]?.id ?? 'claims-resubmission-queue',
                  targetLabel: rows[0]?.id ?? 'Claims resubmission queue',
                  reason: 'Provider user started a claim resubmission from the claims and billing workspace.'
                }}
              />
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Check claim status
              </button>
            </div>
          </SurfaceCard>
        </>
      }
    >
      <SurfaceCard title="Claims work queue" description="Filter denials, resubmissions, and billing risk from one operational workspace.">
        <ClaimsTable rows={rows} />
      </SurfaceCard>
    </WorkspaceFrame>
  );
}

export function ProviderPatientsWorkspace({
  clinicName,
  dashboard
}: {
  clinicName: string;
  dashboard: ProviderOperationsDashboardContract;
}) {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'all';
  const records = buildPatientRecords(dashboard).filter((record) => {
    if (filter === 'eligibility') return record.readinessIssues.some((issue) => /eligibility/i.test(issue));
    if (filter === 'authorizations') return record.authorizations.some((row) => row.status === 'due_soon' || row.status === 'expired' || row.status === 'low_visits');
    if (filter === 'claims') return record.claims.some((row) => row.status === 'denied' || row.status === 'pending_resubmission');
    if (filter === 'at_risk') return record.readinessIssues.length > 0 || record.claims.some((row) => row.status === 'denied');
    return true;
  });
  const selectedPatientId = searchParams.get('patient') ?? records[0]?.id ?? null;
  const selected = records.find((record) => record.id === selectedPatientId) ?? records[0] ?? null;

  return (
    <WorkspaceFrame
      title="Patients"
      description="Keep each child’s sessions, auth pressure, claims status, and eligibility context in one workspace."
      clinicName={clinicName}
      basePath="/provider/patients"
      selectedFilter={filter}
      filters={[
        { id: 'all', label: 'All patients' },
        { id: 'at_risk', label: 'At risk' },
        { id: 'eligibility', label: 'Eligibility' },
        { id: 'authorizations', label: 'Auth pressure' },
        { id: 'claims', label: 'Claims issues' }
      ]}
      sidePanel={
        selected ? (
          <SurfaceCard title={selected.patientName} description={`${selected.caseName} · ${selected.organizationUnitName}`}>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Therapists</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">{selected.therapists.join(', ')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Upcoming sessions</p>
                <div className="mt-2 space-y-2">
                  {selected.upcomingSessions.slice(0, 4).map((session) => (
                    <div key={session.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm">
                      <p className="font-semibold text-[var(--text-primary)]">{session.startTime} · {session.setting}</p>
                      <p className="mt-1 text-[var(--text-secondary)]">{session.nextAction}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Auths + claims</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {selected.authorizations.length} auths · {selected.claims.length} claims
                </p>
              </div>
            </div>
          </SurfaceCard>
        ) : null
      }
    >
      <SurfaceCard title="Patient directory" description="Pick a child and work the operational context without leaving the workspace.">
        <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
          <table className="portal-data-table min-w-[980px] w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--text-muted)]">
                <th className="px-4 py-3 font-medium">Child / Case</th>
                <th className="px-4 py-3 font-medium">Organization Unit</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium">Auths</th>
                <th className="px-4 py-3 font-medium">Claims</th>
                <th className="px-4 py-3 font-medium">Readiness</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const active = selected?.id === record.id;
                return (
                  <tr key={record.id} className={`border-t border-[var(--border-subtle)] ${active ? 'bg-slate-50' : ''}`}>
                    <td className="px-4 py-3">
                      <Link
                        href={workspaceHref('/provider/patients', filter, record.id)}
                        className="font-semibold text-[var(--text-primary)] hover:text-[var(--tenant-primary-color)]"
                      >
                        {record.patientName}
                      </Link>
                      <p className="mt-1 text-[var(--text-secondary)]">{record.caseName}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{record.organizationUnitName}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{record.upcomingSessions.length}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{record.authorizations.length}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{record.claims.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {record.readinessIssues.slice(0, 3).map((issue) => (
                          <span
                            key={issue}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </WorkspaceFrame>
  );
}
