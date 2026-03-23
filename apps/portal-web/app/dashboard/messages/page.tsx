import type { MemberMessage } from '@payer-portal/api-contracts';

import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../../../components/portal-ui';
import { getMemberMessages } from '../../../lib/member-api';
import { formatDate, titleCase } from '../../../lib/portal-format';
import { getPortalSessionUser } from '../../../lib/portal-session';

export default async function MessagesPage() {
  const sessionUser = await getPortalSessionUser();
  const messages = await getMemberMessages(sessionUser?.id);
  const items = messages?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Messages"
        title="Secure messages"
        description="Use secure messaging for claims questions, support follow-up, and document requests."
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <SurfaceCard
          title="New message"
          description="Start a guided support request."
        >
          <form className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-[var(--text-primary)]">Topic</span>
              <select className="portal-input mt-2 px-4 py-3 text-sm outline-none">
                <option>Claims question</option>
                <option>Benefits and coverage</option>
                <option>ID card request</option>
                <option>Billing support</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[var(--text-primary)]">Message</span>
              <textarea
                className="mt-2 min-h-40 w-full rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-sm outline-none"
                placeholder="Describe what you need help with."
              />
            </label>
            <p className="text-[13px] text-[var(--text-muted)]">
              Replies may include benefits guidance, claim status updates, or document requests.
            </p>
            <button className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white">
              Send secure message
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard
          title="Inbox"
          description="Your latest secure conversations."
        >
          {items.length === 0 ? (
            <EmptyState
              title="No messages available"
              description="Secure messages will appear here when available."
            />
          ) : (
            <div className="space-y-4">
              {items.map((message: MemberMessage) => (
                <article key={message.id} className="rounded-2xl bg-[var(--bg-page)] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {message.subject}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        From {message.from} • {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <StatusBadge label={titleCase(message.status)} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {message.preview}
                  </p>
                </article>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
