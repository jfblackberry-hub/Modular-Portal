import Link from 'next/link';

import { getMemberClaims } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';
import { formatCurrency, formatDate } from '../../../lib/portal-format';
import {
  EmptyState,
  InlineButton,
  PageHeader,
  StatCard,
  StatusBadge,
  SurfaceCard
} from '../../../components/portal-ui';

export default async function ClaimsPage() {
  const sessionUser = await getPortalSessionUser();
  const claims = await getMemberClaims(sessionUser?.id);
  const items = claims?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Claims"
        title="Claims and explanations of benefits"
        description="Track payment progress, review claim details, and open EOB-related documents from a single claims workspace."
        actions={<InlineButton href="/dashboard/documents">Open documents</InlineButton>}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          label="Claims count"
          value={String(items.length)}
          detail="Claims available in your current local member feed."
          tone="info"
        />
        <StatCard
          label="Pending items"
          value="1"
          detail="Claims currently waiting on additional review."
          tone="warning"
        />
        <StatCard
          label="Approved this month"
          value="1"
          detail="Recently finalized claims with member responsibility calculated."
          tone="success"
        />
        <StatCard
          label="Member responsibility"
          value={items[0] ? formatCurrency(items[0].totalAmount * 0.2) : '$0.00'}
          detail="Estimated share after plan payment for your latest claim."
          tone="default"
        />
      </div>

      <SurfaceCard
        title="Claims list"
        description="Use the filter bar to narrow results by status or claim date."
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))]">
          <input
            className="portal-input px-4 py-3 text-sm outline-none"
            placeholder="Search claims"
            aria-label="Search claims"
          />
          <select className="portal-input px-4 py-3 text-sm outline-none" aria-label="Filter by status">
            <option>All statuses</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Denied</option>
          </select>
          <input className="portal-input px-4 py-3 text-sm outline-none" type="month" aria-label="Filter claims by month" />
          <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)]">
            Export
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No claims available"
            description="Claims will appear here when the local member API is available."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
            <table className="portal-data-table min-w-full divide-y divide-[var(--border-subtle)] bg-white text-left text-sm">
              <thead>
                <tr className="text-[13px] font-semibold text-[var(--text-secondary)]">
                  <th className="px-4 py-3">Claim</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Billed</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {items.map((item) => (
                  <tr key={item.id} className="h-11">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {item.claimNumber}
                        </p>
                        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                          {item.sourceSystem}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {formatDate(item.claimDate)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={titleCase(item.status)} />
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/dashboard/claims/${item.id}`}
                        className="text-sm font-semibold text-[var(--tenant-primary-color)]"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}

function titleCase(value: string) {
  return value
    .split(/[\s-_]+/)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}
