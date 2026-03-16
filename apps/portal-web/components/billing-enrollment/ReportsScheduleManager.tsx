'use client';

import { useState } from 'react';

import type { ReportDefinition, ReportId, ScheduledReportRecord } from '../../lib/reports-analytics-data';
import { EmptyState, StatusBadge } from '../portal-ui';

export function ReportsScheduleManager({
  schedules,
  reportDefinitions
}: {
  schedules: ScheduledReportRecord[];
  reportDefinitions: ReportDefinition[];
}) {
  const [message, setMessage] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<ReportId>('employee-census');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [delivery, setDelivery] = useState<'Email Delivery' | 'Downloadable Archive'>('Email Delivery');
  const [presetName, setPresetName] = useState('Operations Weekly Snapshot');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(`Scheduled ${selectedReportId} as ${frequency} with ${delivery} using preset "${presetName}".`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Reports &amp; Analytics</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">Scheduled Reports</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">Configure daily, weekly, and monthly scheduled report delivery with saved presets.</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Configure Schedule</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Report
              <select value={selectedReportId} onChange={(event) => setSelectedReportId(event.target.value as ReportId)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                {reportDefinitions.map((report) => (
                  <option key={report.id} value={report.id}>{report.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Frequency
              <select value={frequency} onChange={(event) => setFrequency(event.target.value as 'Daily' | 'Weekly' | 'Monthly')} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Delivery
              <select value={delivery} onChange={(event) => setDelivery(event.target.value as 'Email Delivery' | 'Downloadable Archive')} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                <option>Email Delivery</option>
                <option>Downloadable Archive</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Saved Filter Preset
              <input value={presetName} onChange={(event) => setPresetName(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
            </label>
            <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">Save Schedule</button>
          </form>

          {message ? (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div>
          ) : null}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scheduled Report Archive</h2>
          {schedules.length === 0 ? (
            <div className="mt-4"><EmptyState title="No scheduled reports" description="Create a schedule to activate recurring report delivery." /></div>
          ) : (
            <ul className="mt-4 space-y-2">
              {schedules.map((schedule) => (
                <li key={schedule.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{schedule.reportId}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{schedule.frequency} • {schedule.delivery}</p>
                      <p className="text-sm text-[var(--text-secondary)]">Preset: {schedule.presetName}</p>
                      <p className="text-xs text-[var(--text-muted)]">Next run: {schedule.nextRunDate}</p>
                    </div>
                    <StatusBadge label={schedule.active ? 'Active' : 'Paused'} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
