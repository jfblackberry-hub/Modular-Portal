'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { AssociatedModule, EmployerTaskPriority, EmployerTaskRecord, EmployerTaskStatus, EmployerTaskType } from '../../lib/employer-notifications-tasks-data';
import { EmptyState, StatusBadge } from '../portal-ui';

type TaskFilters = {
  query: string;
  taskType: 'all' | EmployerTaskType;
  priority: 'all' | EmployerTaskPriority;
  status: 'all' | EmployerTaskStatus;
  dueDate: string;
  associatedModule: 'all' | AssociatedModule;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function EmployerTasksDashboard({
  tasks,
  taskTypes,
  priorities,
  statuses,
  modules
}: {
  tasks: EmployerTaskRecord[];
  taskTypes: EmployerTaskType[];
  priorities: EmployerTaskPriority[];
  statuses: EmployerTaskStatus[];
  modules: AssociatedModule[];
}) {
  const [filters, setFilters] = useState<TaskFilters>({
    query: '',
    taskType: 'all',
    priority: 'all',
    status: 'all',
    dueDate: '',
    associatedModule: 'all'
  });
  const [message, setMessage] = useState('');

  const filtered = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return tasks.filter((task) => {
      const searchable = [
        task.id,
        task.taskType,
        task.taskDescription,
        task.associatedEmployee,
        task.associatedInvoice,
        task.associatedModule
      ]
        .join(' ')
        .toLowerCase();

      const queryMatch = !normalizedQuery || searchable.includes(normalizedQuery);
      const taskTypeMatch = filters.taskType === 'all' || task.taskType === filters.taskType;
      const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;
      const statusMatch = filters.status === 'all' || task.status === filters.status;
      const dueDateMatch = !filters.dueDate || task.dueDate === filters.dueDate;
      const moduleMatch =
        filters.associatedModule === 'all' || task.associatedModule === filters.associatedModule;

      return queryMatch && taskTypeMatch && priorityMatch && statusMatch && dueDateMatch && moduleMatch;
    });
  }, [tasks, filters]);

  function markTaskComplete(task: EmployerTaskRecord) {
    setMessage(`${task.id} marked complete (mock action).`);
  }

  function assignTask(task: EmployerTaskRecord) {
    setMessage(`${task.id} assigned to queue for future multi-admin support.`);
  }

  function markFilteredComplete() {
    const openCount = filtered.filter((task) => task.status !== 'Completed').length;
    setMessage(`${openCount} tasks queued for completion (mock bulk action).`);
  }

  return (
    <div className="space-y-5">
      <section className="portal-card p-6 sm:p-8">
        <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">Notifications &amp; Tasks</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
          Tasks Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
          Track operational tasks for enrollment, billing, compliance, and document workflows.
        </p>
      </section>

      <section className="portal-card p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Search</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search task ID, description, employee, invoice"
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Task Type</span>
            <select value={filters.taskType} onChange={(event) => setFilters((current) => ({ ...current, taskType: event.target.value as TaskFilters['taskType'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All task types</option>
              {taskTypes.map((taskType) => (<option key={taskType} value={taskType}>{taskType}</option>))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Priority</span>
            <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value as TaskFilters['priority'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All priorities</option>
              {priorities.map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TaskFilters['status'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All statuses</option>
              {statuses.map((status) => (<option key={status} value={status}>{status}</option>))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Due Date</span>
            <input type="date" value={filters.dueDate} onChange={(event) => setFilters((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Associated Module</span>
            <select value={filters.associatedModule} onChange={(event) => setFilters((current) => ({ ...current, associatedModule: event.target.value as TaskFilters['associatedModule'] }))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
              <option value="all">All modules</option>
              {modules.map((module) => (<option key={module} value={module}>{module}</option>))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={markFilteredComplete} className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white">
            Mark Tasks Complete
          </button>
          <Link href="/dashboard/billing-enrollment/notifications" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-[var(--tenant-primary-color)]">
            View Notifications
          </Link>
        </div>
        {message ? <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">{message}</p> : null}
      </section>

      <section className="portal-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Task List</h2>
          <p className="text-sm text-[var(--text-secondary)]">Showing {filtered.length} of {tasks.length}</p>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No open tasks" description="Operational tasks will appear here when actions are required." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No matching tasks" description="Adjust your filters to find relevant tasks." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="portal-data-table w-full border-collapse bg-white text-sm">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Task Type</th>
                  <th>Task Description</th>
                  <th>Priority</th>
                  <th>Associated Employee</th>
                  <th>Associated Invoice</th>
                  <th>Created Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    <td>{task.taskType}</td>
                    <td>{task.taskDescription}</td>
                    <td><StatusBadge label={task.priority} /></td>
                    <td>{task.associatedEmployee ?? '—'}</td>
                    <td>{task.associatedInvoice ?? '—'}</td>
                    <td>{formatDate(task.createdDate)}</td>
                    <td>{formatDate(task.dueDate)}</td>
                    <td><StatusBadge label={task.status} /></td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/dashboard/billing-enrollment/tasks/${task.id}`} className="rounded-full border border-[var(--tenant-primary-color)] px-2.5 py-1 text-xs font-semibold text-[var(--tenant-primary-color)]">View Task Details</Link>
                        <button type="button" onClick={() => markTaskComplete(task)} className="rounded-full border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700">Mark Complete</button>
                        <button type="button" onClick={() => assignTask(task)} className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700">Assign to User</button>
                        <Link href={task.relatedRecordHref} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">View Related Record</Link>
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
