'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { BrokerGroup } from '../../lib/broker-portfolio-data';
import { EmptyState, InlineButton, PageHeader, StatCard, StatusBadge, SurfaceCard } from '../portal-ui';

type BookFilters = {
  search: string;
  renewalMonth: string;
  lineOfBusiness: string;
  status: string;
  region: string;
  assignedRep: string;
  sortBy: 'groupName' | 'renewalDate' | 'enrolledLives' | 'status';
};

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getRenewalMonth(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'long' });
}

export function BrokerBookOfBusinessPage({
  groups,
  filterOptions
}: {
  groups: BrokerGroup[];
  filterOptions: {
    renewalMonths: string[];
    linesOfBusiness: string[];
    statuses: string[];
    regions: string[];
    assignedReps: string[];
  };
}) {
  const [filters, setFilters] = useState<BookFilters>({
    search: '',
    renewalMonth: '',
    lineOfBusiness: '',
    status: '',
    region: '',
    assignedRep: '',
    sortBy: 'renewalDate'
  });

  const filteredGroups = useMemo(() => {
    const normalizedQuery = filters.search.trim().toLowerCase();
    const next = groups
      .filter((group) => {
        if (
          normalizedQuery &&
          ![
            group.groupName,
            group.accountManager,
            group.assignedRep,
            group.currentProducts.join(' ')
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        ) {
          return false;
        }

        if (filters.renewalMonth && getRenewalMonth(group.renewalDate) !== filters.renewalMonth) {
          return false;
        }

        if (filters.lineOfBusiness && group.lineOfBusiness !== filters.lineOfBusiness) {
          return false;
        }

        if (filters.status && group.status !== filters.status) {
          return false;
        }

        if (filters.region && group.region !== filters.region) {
          return false;
        }

        if (filters.assignedRep && group.assignedRep !== filters.assignedRep) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (filters.sortBy === 'groupName') {
          return left.groupName.localeCompare(right.groupName);
        }

        if (filters.sortBy === 'renewalDate') {
          return left.renewalDate.localeCompare(right.renewalDate);
        }

        if (filters.sortBy === 'enrolledLives') {
          return right.enrolledLives - left.enrolledLives;
        }

        return left.status.localeCompare(right.status);
      });

    return next;
  }, [filters, groups]);

  const summary = useMemo(
    () => ({
      active: groups.filter((group) => group.status === 'Active').length,
      inRenewal: groups.filter((group) => group.status === 'Renewal in progress').length,
      inQuote: groups.filter((group) => group.quoteOpportunity).length,
      atRisk: groups.filter((group) => group.status === 'At risk').length
    }),
    [groups]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Book of business"
        description="Search and manage employer groups across renewals, quotes, enrollment readiness, and account health from one broker portfolio view."
        actions={
          <>
            <InlineButton href="/broker/renewals" tone="secondary">
              Review renewals
            </InlineButton>
            <InlineButton href="/broker/quotes">Start quote</InlineButton>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active groups"
          value={summary.active.toString()}
          detail="Employer groups operating normally in the current portfolio."
          tone="success"
        />
        <StatCard
          label="In renewal"
          value={summary.inRenewal.toString()}
          detail="Accounts currently moving through renewal pricing and decision work."
          tone="warning"
        />
        <StatCard
          label="Open quotes"
          value={summary.inQuote.toString()}
          detail="Prospects and incumbent groups with active marketing activity."
          tone="info"
        />
        <StatCard
          label="At risk"
          value={summary.atRisk.toString()}
          detail="Groups with timing, document, or carrier issues needing escalation."
          tone="danger"
        />
      </section>

      <SurfaceCard title="Portfolio filters" description="Search and narrow the broker portfolio by renewal timing, line of business, ownership, and account status.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="text-sm text-[var(--text-secondary)] xl:col-span-2">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Search group name</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              placeholder="Search employer group"
              className="portal-input w-full px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
            />
          </label>
          {[
            {
              key: 'renewalMonth',
              label: 'Renewal month',
              options: filterOptions.renewalMonths
            },
            {
              key: 'lineOfBusiness',
              label: 'Line of business',
              options: filterOptions.linesOfBusiness
            },
            {
              key: 'status',
              label: 'Status',
              options: filterOptions.statuses
            },
            {
              key: 'region',
              label: 'Region',
              options: filterOptions.regions
            },
            {
              key: 'assignedRep',
              label: 'Assigned rep',
              options: filterOptions.assignedReps
            },
            {
              key: 'sortBy',
              label: 'Sort by',
              options: ['groupName', 'renewalDate', 'enrolledLives', 'status']
            }
          ].map((field) => (
            <label key={field.key} className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">{field.label}</span>
              <select
                value={filters[field.key as keyof BookFilters] as string}
                onChange={(event) =>
                  setFilters({
                    ...filters,
                    [field.key]: event.target.value
                  })
                }
                className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]"
              >
                <option value="">{field.key === 'sortBy' ? 'Select sort' : 'All'}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setFilters({ ...filters })}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={() =>
              setFilters({
                search: '',
                renewalMonth: '',
                lineOfBusiness: '',
                status: '',
                region: '',
                assignedRep: '',
                sortBy: 'renewalDate'
              })
            }
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Reset
          </button>
        </div>
      </SurfaceCard>

      <SurfaceCard
        title="Assigned employer groups"
        description={`${filteredGroups.length} group${filteredGroups.length === 1 ? '' : 's'} currently match the active search and filter set.`}
      >
        {filteredGroups.length === 0 ? (
          <EmptyState
            title="No groups match these filters"
            description="Try broadening the search, clearing one of the filters, or sorting by a different portfolio dimension."
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="portal-data-table min-w-[1120px] w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    <th>Group name</th>
                    <th>Segment</th>
                    <th>Effective date</th>
                    <th>Renewal date</th>
                    <th>Enrolled lives</th>
                    <th>Current products</th>
                    <th>Status</th>
                    <th>Assigned account manager</th>
                    <th>Alerts / exceptions</th>
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
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {group.region} • Rep {group.assignedRep}
                        </p>
                      </td>
                      <td>{group.segment}</td>
                      <td>{formatDateLabel(group.effectiveDate)}</td>
                      <td>{formatDateLabel(group.renewalDate)}</td>
                      <td>{group.enrolledLives.toLocaleString()}</td>
                      <td>{group.currentProducts.join(', ')}</td>
                      <td>
                        <StatusBadge label={group.status} />
                      </td>
                      <td>{group.accountManager}</td>
                      <td>
                        {group.alerts.length > 0 ? (
                          <div className="space-y-1">
                            {group.alerts.slice(0, 2).map((alert) => (
                              <p key={alert} className="text-xs leading-5 text-[var(--text-secondary)]">
                                {alert}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">No active exceptions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {filteredGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/broker/book-of-business/${group.id}`}
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white p-4 transition hover:border-[var(--tenant-primary-color)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{group.groupName}</h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {group.segment} • {group.region}
                      </p>
                    </div>
                    <StatusBadge label={group.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-[var(--text-secondary)]">
                    <p>Renewal: {formatDateLabel(group.renewalDate)}</p>
                    <p>Lives: {group.enrolledLives.toLocaleString()}</p>
                    <p>LOB: {group.lineOfBusiness}</p>
                    <p>Rep: {group.assignedRep}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </SurfaceCard>
    </div>
  );
}
