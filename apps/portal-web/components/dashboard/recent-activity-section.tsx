import { formatCurrency, formatDate } from '../../lib/portal-format';

type ClaimItem = {
  claimDate: string;
  claimNumber: string;
  status: string;
  totalAmount: number;
};

type MessageItem = {
  createdAt: string;
  status: string;
  subject: string;
};

type DocumentItem = {
  createdAt: string;
  title: string;
};

function titleCaseStatus(value: string) {
  return value
    .split(/[\s-_]+/)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

export function RecentActivitySection({
  claims,
  documents,
  messages
}: {
  claims: ClaimItem[];
  documents: DocumentItem[];
  messages: MessageItem[];
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm" aria-label="Recent Activity">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recent Activity</h2>

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Recent claims
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            {claims.length > 0 ? (
              claims.map((claim) => (
                <li
                  key={claim.claimNumber}
                  className="rounded-xl bg-[var(--bg-page)] px-4 py-3 transition hover:-translate-y-0.5 hover:bg-sky-50/60"
                >
                  {claim.claimNumber} • {titleCaseStatus(claim.status)} •{' '}
                  {formatCurrency(claim.totalAmount)} • {formatDate(claim.claimDate)}
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-[var(--bg-page)] px-4 py-3">
                No claims yet. Claims submitted to your plan will appear here once processed.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Recent messages
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            {messages.length > 0 ? (
              messages.map((message) => (
                <li
                  key={`${message.subject}-${message.createdAt}`}
                  className="rounded-xl bg-[var(--bg-page)] px-4 py-3 transition hover:-translate-y-0.5 hover:bg-sky-50/60"
                >
                  {message.subject} • {titleCaseStatus(message.status)} • {formatDate(message.createdAt)}
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-[var(--bg-page)] px-4 py-3">
                No messages yet. Check back later or send support a secure message.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Recent documents
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            {documents.length > 0 ? (
              documents.map((document) => (
                <li
                  key={`${document.title}-${document.createdAt}`}
                  className="rounded-xl bg-[var(--bg-page)] px-4 py-3 transition hover:-translate-y-0.5 hover:bg-sky-50/60"
                >
                  {document.title} • {formatDate(document.createdAt)}
                </li>
              ))
            ) : (
              <li className="rounded-xl bg-[var(--bg-page)] px-4 py-3">No recent documents.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
