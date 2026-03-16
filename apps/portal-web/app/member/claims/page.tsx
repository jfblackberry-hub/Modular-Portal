import { getMemberClaims } from '../../../lib/member-api';
import { formatCurrency, formatDate, titleCase } from '../../../lib/portal-format';
import { getPortalSessionUser } from '../../../lib/portal-session';
import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../../../components/portal-ui';

export default async function MemberClaimsPage() {
  const sessionUser = await getPortalSessionUser();
  const claims = await getMemberClaims(sessionUser?.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member plugin"
        title="Claims"
        description="Plugin-scoped claims view using the same member-friendly presentation patterns."
      />

      {claims?.items.length ? (
        <div className="space-y-4">
          {claims.items.map((item) => (
            <SurfaceCard
              key={item.id}
              title={item.claimNumber}
              description={`Claim date ${formatDate(item.claimDate)}`}
              action={<StatusBadge label={titleCase(item.status)} />}
            >
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Total billed {formatCurrency(item.totalAmount)} • {item.sourceSystem} • {item.sourceRecordId}
              </p>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Claims unavailable"
          description="Claims data is unavailable until the local API is running."
        />
      )}
    </div>
  );
}
