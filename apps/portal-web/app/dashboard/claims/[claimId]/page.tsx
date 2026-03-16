import Link from 'next/link';

import { getMemberClaims } from '../../../../lib/member-api';
import { getPortalSessionUser } from '../../../../lib/portal-session';
import { formatCurrency, formatDate } from '../../../../lib/portal-format';
import {
  EmptyState,
  InlineButton,
  PageHeader,
  StatusBadge,
  SurfaceCard
} from '../../../../components/portal-ui';

export default async function ClaimDetailPage({
  params
}: {
  params: Promise<{ claimId: string }>;
}) {
  const { claimId } = await params;
  const sessionUser = await getPortalSessionUser();
  const claims = await getMemberClaims(sessionUser?.id);
  const claim = claims?.items.find((item) => item.id === claimId) ?? claims?.items[0];

  if (!claim) {
    return (
      <EmptyState
        title="Claim not found"
        description="The selected claim detail is unavailable. Return to the claims list and try again."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Claim detail"
        title={`Claim ${claim.claimNumber}`}
        description="Review claim status, payment breakdown, and next steps."
        actions={
          <>
            <InlineButton href="/dashboard/claims" tone="secondary">
              Back to claims
            </InlineButton>
            <InlineButton href="/dashboard/documents">View EOB</InlineButton>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <SurfaceCard title="Status">
          <StatusBadge label={claim.status} />
        </SurfaceCard>
        <SurfaceCard title="Date of service">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {formatDate(claim.claimDate)}
          </p>
        </SurfaceCard>
        <SurfaceCard title="Total billed">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {formatCurrency(claim.totalAmount)}
          </p>
        </SurfaceCard>
        <SurfaceCard title="Member responsibility">
          <p className="text-lg font-semibold text-[var(--text-primary)]">
            {formatCurrency(claim.totalAmount * 0.2)}
          </p>
        </SurfaceCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard
          title="Payment timeline"
          description="A guided summary of where this claim is in the process."
        >
          <ol className="space-y-4">
            {[
              ['Received', 'Claim submitted and entered into the claims system.'],
              ['Processing', 'Benefits and provider eligibility validated.'],
              ['Payment review', 'Member responsibility calculated and EOB prepared.'],
              ['Complete', 'Claim finalized and available in documents.']
            ].map(([title, detail], index) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-[var(--bg-page)] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--tenant-primary-soft-color)] font-semibold text-[var(--tenant-primary-color)]">
                  {index + 1}
                </div>
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SurfaceCard>

        <SurfaceCard
          title="Claim details"
          description="Additional information members often need when reviewing a claim."
        >
          <dl className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-3">
              <dt className="text-[var(--text-secondary)]">Source system</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{claim.sourceSystem}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-3">
              <dt className="text-[var(--text-secondary)]">Source record</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{claim.sourceRecordId}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-3">
              <dt className="text-[var(--text-secondary)]">Coverage record</dt>
              <dd className="font-semibold text-[var(--text-primary)]">{claim.coverageId}</dd>
            </div>
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              <p className="font-semibold text-[var(--text-primary)]">Need help?</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                If the billed amount does not match a provider invoice, contact support or send a secure message with the claim number.
              </p>
              <Link
                href="/dashboard/messages"
                className="mt-4 inline-flex text-sm font-semibold text-[var(--tenant-primary-color)]"
              >
                Contact support
              </Link>
            </div>
          </dl>
        </SurfaceCard>
      </div>
    </div>
  );
}
