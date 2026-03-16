'use client';

import Link from 'next/link';

import type { EmployerTaskRecord } from '../../lib/employer-notifications-tasks-data';
import { EmptyState, StatusBadge } from '../portal-ui';

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function EmployerTaskDetailView({ task }: { task: EmployerTaskRecord }) {
  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Task Detail</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          {task.taskType}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{task.id}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/billing-enrollment/tasks" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">Back to Tasks</Link>
          <Link href={task.relatedRecordHref} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">View Related Record</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Priority</p>
          <div className="mt-2"><StatusBadge label={task.priority} /></div>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Module</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{task.associatedModule}</p>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Status</p>
          <div className="mt-2"><StatusBadge label={task.status} /></div>
        </article>
        <article className="portal-card p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Due Date</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{formatDate(task.dueDate)}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Task Description</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{task.taskDescription}</p>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Associated Employee</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{task.associatedEmployee ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Associated Invoice</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{task.associatedInvoice ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--text-secondary)]">Created Date</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{formatDate(task.createdDate)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {task.actionButtons.map((action) => (
              <button key={action} type="button" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
                {action}
              </button>
            ))}
          </div>
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Task Status Audit History</h2>
          {task.auditHistory.length === 0 ? (
            <div className="mt-4"><EmptyState title="No task history" description="Task updates will appear here." /></div>
          ) : (
            <ul className="mt-4 space-y-2">
              {task.auditHistory.map((event) => (
                <li key={event.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--text-primary)]">{event.action}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDateTime(event.occurredAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.actor}</p>
                  {event.note ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
