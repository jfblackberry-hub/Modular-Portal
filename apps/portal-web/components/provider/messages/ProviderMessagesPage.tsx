'use client';

import { useMemo, useState } from 'react';

import type {
  ProviderMessageCategory,
  ProviderMessageItem,
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';

type DateFilter = 'all' | '7d' | '30d';

function daysSince(dateString: string) {
  const input = new Date(`${dateString}T00:00:00Z`).getTime();
  const now = Date.now();
  const diff = now - input;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function PriorityPill({ priority }: { priority: ProviderMessageItem['priority'] }) {
  const className =
    priority === 'High'
      ? 'bg-rose-50 text-rose-700'
      : priority === 'Medium'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-700';

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{priority}</span>;
}

function AnnouncementPill({ type }: { type: 'banner' | 'info' | 'maintenance' }) {
  const className =
    type === 'banner'
      ? 'bg-rose-50 text-rose-700'
      : type === 'maintenance'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-sky-50 text-sky-700';

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{type}</span>;
}

export function ProviderMessagesPage({
  config,
  variant
}: {
  config: ProviderPortalConfig;
  variant: ProviderPortalVariant;
}) {
  const module = config.messagesModule;
  const [selectedMessageId, setSelectedMessageId] = useState(module.inbox[0]?.id ?? '');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyActionRequired, setOnlyActionRequired] = useState(false);
  const [category, setCategory] = useState<'all' | ProviderMessageCategory>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredMessages = useMemo(() => {
    return module.inbox.filter((message) => {
      if (onlyUnread && !message.unread) {
        return false;
      }

      if (onlyActionRequired && !message.actionRequired) {
        return false;
      }

      if (category !== 'all' && message.category !== category) {
        return false;
      }

      if (dateFilter === '7d' && daysSince(message.date) > 7) {
        return false;
      }

      if (dateFilter === '30d' && daysSince(message.date) > 30) {
        return false;
      }

      return true;
    });
  }, [module.inbox, onlyUnread, onlyActionRequired, category, dateFilter]);

  const selectedMessage =
    filteredMessages.find((message) => message.id === selectedMessageId) ?? filteredMessages[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.displayName}
        title={variant === 'medical' ? 'Provider Messages and Alerts' : config.routeContent.messages.title}
        description="Manage secure operational communication, announcements, and alerts in one inbox workspace."
      />

      <SurfaceCard title="Quick Filters" description="Filter by unread status, action required, category, and date.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" checked={onlyUnread} onChange={(event) => setOnlyUnread(event.target.checked)} />
            Unread
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={onlyActionRequired}
              onChange={(event) => setOnlyActionRequired(event.target.checked)}
            />
            Action required
          </label>

          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as 'all' | ProviderMessageCategory)}
              className="portal-input px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {module.categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-[var(--text-secondary)]">
            <span className="mb-1 block font-medium text-[var(--text-primary)]">Date</span>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="portal-input px-3 py-2 text-sm"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </label>
        </div>
      </SurfaceCard>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <SurfaceCard title="Inbox" description={`Showing ${filteredMessages.length} message${filteredMessages.length === 1 ? '' : 's'}.`}>
          <div className="space-y-2">
            {filteredMessages.map((message) => {
              const active = selectedMessage?.id === message.id;
              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedMessageId(message.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? 'border-[var(--tenant-primary-color)] bg-[var(--tenant-primary-soft-color)]'
                      : 'border-[var(--border-subtle)] bg-white hover:border-[var(--tenant-primary-color)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{message.subject}</p>
                    <PriorityPill priority={message.priority} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{message.category} • {message.date}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{message.preview}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge label={message.unread ? 'Unread' : 'Read'} />
                    {message.actionRequired ? <StatusBadge label="Action Required" /> : null}
                  </div>
                </button>
              );
            })}

            {filteredMessages.length === 0 ? (
              <article className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-slate-50 px-3 py-5 text-center">
                <p className="text-sm font-semibold text-[var(--text-primary)]">No messages match current filters.</p>
              </article>
            ) : null}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard title="Message Detail" description="Read full message content and identify next actions.">
            {selectedMessage ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedMessage.subject}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {selectedMessage.category} • {selectedMessage.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityPill priority={selectedMessage.priority} />
                    <StatusBadge label={selectedMessage.unread ? 'Unread' : 'Read'} />
                  </div>
                </div>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{selectedMessage.body}</p>
                {selectedMessage.actionRequired ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Action required: Review and complete follow-up for this message.
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Select a message to view details.</p>
            )}
          </SurfaceCard>

          <SurfaceCard title="Announcements and Alerts" description="Banner alerts, informational notices, and scheduled maintenance updates.">
            <div className="space-y-3">
              {module.announcements.map((item) => (
                <article key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <AnnouncementPill type={item.type} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.message}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{item.date}</p>
                </article>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
