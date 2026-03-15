import Link from 'next/link';

import {
  getMemberClaims,
  getMemberCoverage,
  getMemberDocuments,
  getMemberProfile
} from '../../lib/member-api';
import { formatCurrency } from '../../lib/portal-format';
import { PageHeader, QuickActionCard, SurfaceCard } from '../../components/portal-ui';

export default async function MemberHomePage() {
  const [profile, coverage, claims, documents] = await Promise.all([
    getMemberProfile(),
    getMemberCoverage(),
    getMemberClaims(),
    getMemberDocuments()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member workspace"
        title="Member plugin workspace"
        description="This plugin route now follows the same light healthcare portal design language as the core dashboard."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <QuickActionCard
          href="/member/profile"
          label="View profile"
          description="Review member demographic details and identifiers."
          icon="👤"
        />
        <QuickActionCard
          href="/member/claims"
          label="Review claims"
          description="Open the member plugin claims list."
          icon="📄"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SurfaceCard title="Profile snapshot" description="Current local API member data">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {profile
              ? `${profile.firstName} ${profile.lastName} • Member ${profile.memberNumber}`
              : 'Profile data is unavailable until the local API is running.'}
          </p>
        </SurfaceCard>
        <SurfaceCard title="Coverage and activity" description="Plugin view summary">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {coverage?.items[0]
              ? `${coverage.items[0].planName} • ${claims?.items.length ?? 0} claim(s) • ${documents?.items.length ?? 0} document(s)`
              : `Latest claim ${claims?.items[0]?.claimNumber ?? 'Unavailable'} for ${claims?.items[0] ? formatCurrency(claims.items[0].totalAmount) : 'n/a'}`}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex text-sm font-semibold text-[var(--tenant-primary-color)]"
          >
            Return to main dashboard
          </Link>
        </SurfaceCard>
      </div>
    </div>
  );
}
