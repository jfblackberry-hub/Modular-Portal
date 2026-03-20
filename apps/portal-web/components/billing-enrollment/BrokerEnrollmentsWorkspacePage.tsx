'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { BrokerGroup, BrokerTask } from '../../lib/broker-portfolio-data';
import { EmptyState, InlineButton, PageHeader, StatCard, StatusBadge, SurfaceCard } from '../portal-ui';

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function isEnrollmentGroup(group: BrokerGroup) {
  return (
    group.status === 'Enrollment in progress' ||
    group.status === 'Implementation active' ||
    group.enrollmentSummary.pendingItems.length > 0
  );
}

export function BrokerEnrollmentsWorkspacePage({
  groups,
  tasks
}: {
  groups: BrokerGroup[];
  tasks: BrokerTask[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const enrollmentGroups = useMemo(
    () =>
      groups
        .filter(isEnrollmentGroup)
        .sort(
          (left, right) =>
            right.enrollmentSummary.pendingItems.length - left.enrollmentSummary.pendingItems.length
        ),
    [groups]
  );

  const enrollmentTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.category === 'enrollment')
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate)),
    [tasks]
  );

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return enrollmentGroups.filter((group) => {
      if (
        normalizedSearch &&
        ![
          group.groupName,
          group.accountManager,
          group.assignedRep,
          group.enrollmentSummary.status,
          group.enrollmentSummary.pendingItems.join(' ')
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (status && group.status !== status) {
        return false;
      }

      return true;
    });
  }, [enrollmentGroups, search, status]);

  const summary = useMemo(() => {
    const pendingItems = enrollmentGroups.reduce(
      (total, group) => total + group.enrollmentSummary.pendingItems.length,
      0
    );
    const effectiveSoon = enrollmentGroups.filter((group) => {
      const today = new Date('2026-03-19T00:00:00');
      const effectiveDate = new Date(`${group.enrollmentSummary.effectiveDate}T00:00:00`);
      const diffDays = Math.ceil(
        (effectiveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0 && diffDays <= 30;
    }).length;

    return {
      active: enrollmentGroups.length,
      atRisk: enrollmentGroups.filter((group) => group.status === 'At risk').length,
      pendingItems,
      effectiveSoon
    };
  }, [enrollmentGroups]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Enrollments"
        description="Track implementation readiness, enrollment file progress, pending verifications, and effective-date risk across employer groups in one broker workspace."
        actions={
          <>
            <InlineButton href="/broker/documents" tone="secondary">
              Open documents
            </InlineButton>
            <InlineButton href="/broker/tasks">Review work queue</InlineButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active enrollments"
          value={summary.active.toString()}
          detail="Groups currently in enrollment, implementation, or active file cleanup."
          tone="info"
        />
        <StatCard
          label="At risk"
          value={summary.atRisk.toString()}
          detail="Groups with timing or operational issues that could impact readiness."
          tone="danger"
        />
        <StatCard
          label="Pending items"
          value={summary.pendingItems.toString()}
          detail="Open enrollment tasks, file corrections, and verification items still unresolved."
          tone="warning"
        />
        <StatCard
          label="Effective in 30 days"
          value={summary.effectiveSoon.toString()}
          detail="Groups with near-term effective dates that need close broker oversight."
          tone="success"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <SurfaceCard title="Enrollment tracker" description="Search broker enrollment work by group, owner, or blocker and review the latest readiness details.">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
            <label className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">Search groups</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employer group or blocker"
                className="portal-input w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
              />
            </label>
            <label className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
              >
                <option value="">All statuses</option>
                {Array.from(new Set(enrollmentGroups.map((group) => group.status))).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <InlineButton href="/broker/book-of-business" tone="secondary">
              Open book of business
            </InlineButton>
            <InlineButton href="/broker/documents" tone="secondary">
              Review missing documents
            </InlineButton>
          </div>

          <div className="mt-6">
            {filteredGroups.length === 0 ? (
              <EmptyState
                title="No enrollment records match the current view"
                description="Clear the filters or broaden the search to review more broker enrollment work."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="portal-data-table min-w-[1120px] w-full border-collapse bg-white text-sm">
                  <thead>
                    <tr>
                      <th>Employer group</th>
                      <th>Enrollment status</th>
                      <th>Portfolio status</th>
                      <th>Completion</th>
                      <th>Pending items</th>
                      <th>Effective date</th>
                      <th>Last file date</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map((group) => (
                      <tr key={group.id}>
                        <td>
                          <Link
                            href={`/broker/book-of-business/${group.id}`}
                            className="font-semibold text-[var(--tenant-primary-color)]"
                          >
                            {group.groupName}
                          </Link>
                        </td>
                        <td>{group.enrollmentSummary.status}</td>
                        <td>
                          <StatusBadge label={group.status} />
                        </td>
                        <td>{group.enrollmentSummary.completionRate}%</td>
                        <td>
                          <div className="space-y-1">
                            <p className="font-medium text-[var(--text-primary)]">
                              {group.enrollmentSummary.pendingItems.length} open
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {group.enrollmentSummary.pendingItems[0] ?? 'No open items'}
                            </p>
                          </div>
                        </td>
                        <td>{formatDateLabel(group.enrollmentSummary.effectiveDate)}</td>
                        <td>{formatDateLabel(group.enrollmentSummary.lastFileDate)}</td>
                        <td>
                          <div className="space-y-1">
                            <p>{group.assignedRep}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {group.accountManager}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <InlineButton href={`/broker/book-of-business/${group.id}`} tone="secondary">
                              View group
                            </InlineButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard title="Enrollment tasks" description="Broker follow-up items tied to implementation, verification, and file readiness.">
            <div className="space-y-3">
              {enrollmentTasks.slice(0, 6).map((task) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="block rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{task.detail}</p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Due {formatDateLabel(task.dueDate)}
                      </p>
                    </div>
                    <StatusBadge label={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Readiness watchlist" description="Groups with the heaviest open enrollment workload right now.">
            <div className="space-y-3">
              {enrollmentGroups.slice(0, 4).map((group) => (
                <Link
                  key={group.id}
                  href={`/broker/book-of-business/${group.id}`}
                  className="block rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{group.groupName}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {group.enrollmentSummary.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--tenant-primary-color)]">
                      {group.enrollmentSummary.completionRate}%
                    </p>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--text-muted)]">
                    {group.enrollmentSummary.pendingItems.slice(0, 2).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
