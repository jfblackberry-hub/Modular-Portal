'use client';

import { useMemo, useState } from 'react';

import type { BrokerCaseRecord } from '../../lib/broker-operations-data';
import { EmptyState, InlineButton, PageHeader, StatusBadge, SurfaceCard } from '../portal-ui';

function TaskDetailDrawer({
  item,
  onClose
}: {
  item: BrokerCaseRecord | null;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-slate-900/35 modal-fade-in" onClick={onClose} aria-label="Close task detail" />
      <aside className="modal-scale-in absolute right-0 top-0 h-full w-full max-w-[720px] overflow-y-auto border-l border-[var(--border-subtle)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Task / case detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{item.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.groupName ?? 'Broker case'} • Owner {item.owner}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Status</p>
            <div className="mt-2"><StatusBadge label={item.status} /></div>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Priority</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{item.priority}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Due date</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{item.dueDate}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Owner</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{item.owner}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <SurfaceCard title="Summary" description="Broker-facing operational context for this task or case.">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.summary}</p>
          </SurfaceCard>
          <SurfaceCard title="Linked references" description="Connected employer, quote, and renewal identifiers for this work item.">
            <div className="space-y-2 text-sm text-[var(--text-secondary)]">
              <p>Group: {item.groupName ?? 'Not linked'}</p>
              <p>Quote: {item.quoteId ?? 'Not linked'}</p>
              <p>Renewal: {item.renewalId ?? 'Not linked'}</p>
            </div>
          </SurfaceCard>
          <SurfaceCard title="Next step" description="Immediate broker follow-up expected from this case.">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.nextStep}</p>
          </SurfaceCard>
        </div>
      </aside>
    </div>
  );
}

export function BrokerTasksCasesWorkspacePage({
  cases,
  filterOptions
}: {
  cases: BrokerCaseRecord[];
  filterOptions: {
    statuses: string[];
    priorities: string[];
    owners: string[];
  };
}) {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [owner, setOwner] = useState('');
  const [selectedCase, setSelectedCase] = useState<BrokerCaseRecord | null>(null);

  const filteredCases = useMemo(
    () =>
      cases.filter((item) => {
        if (status && item.status !== status) return false;
        if (priority && item.priority !== priority) return false;
        if (owner && item.owner !== owner) return false;
        return true;
      }),
    [cases, owner, priority, status]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Broker E&B Portal"
        title="Tasks and cases"
        description="Unified broker work queue for renewal follow-up, quote actions, implementation issues, document requests, and carrier service cases."
        actions={<InlineButton href="/broker/book-of-business" tone="secondary">Open book of business</InlineButton>}
      />

      <SurfaceCard title="Work queue filters" description="Narrow the broker queue by case status, priority, and assigned owner.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Status', value: status, setter: setStatus, options: filterOptions.statuses },
            { label: 'Priority', value: priority, setter: setPriority, options: filterOptions.priorities },
            { label: 'Owner', value: owner, setter: setOwner, options: filterOptions.owners }
          ].map((field) => (
            <label key={field.label} className="text-sm text-[var(--text-secondary)]">
              <span className="mb-1 block font-medium text-[var(--text-primary)]">{field.label}</span>
              <select value={field.value} onChange={(event) => field.setter(event.target.value)} className="portal-input w-full bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary-color)]">
                <option value="">All</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Broker work queue" description={`${filteredCases.length} case${filteredCases.length === 1 ? '' : 's'} currently match the active queue view.`}>
        {filteredCases.length === 0 ? (
          <EmptyState title="No cases match this view" description="Try clearing one of the queue filters to bring more broker work items back into scope." />
        ) : (
          <div className="space-y-3">
            {filteredCases.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedCase(item)} className="w-full rounded-3xl border border-[var(--border-subtle)] bg-white p-4 text-left transition hover:border-[var(--tenant-primary-color)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.summary}</p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {item.groupName ?? 'Broker case'} • Due {item.dueDate} • Owner {item.owner}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {item.quoteId ? `Quote ${item.quoteId}` : item.renewalId ? `Renewal ${item.renewalId}` : 'Group-linked case'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={item.priority} />
                    <StatusBadge label={item.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </SurfaceCard>

      <TaskDetailDrawer item={selectedCase} onClose={() => setSelectedCase(null)} />
    </div>
  );
}
