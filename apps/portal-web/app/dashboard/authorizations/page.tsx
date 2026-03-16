import type { MemberAuthorization } from '@payer-portal/api-contracts';

import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../../../components/portal-ui';
import { getMemberAuthorizations } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';
import { formatDate } from '../../../lib/portal-format';

export default async function AuthorizationsPage() {
  const sessionUser = await getPortalSessionUser();
  const authorizations = await getMemberAuthorizations(sessionUser?.id);
  const items = authorizations?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Authorizations"
        title="Prior authorizations"
        description="Track service requests, decision status, and any documents needed to keep care moving."
      />
      {items.length === 0 ? (
        <EmptyState
          title="No authorizations available"
          description="Prior authorization requests will appear here when available."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item: MemberAuthorization) => (
            <SurfaceCard
              key={item.id}
              title={item.service}
              description={`Submitted ${formatDate(item.submittedOn)}`}
            >
              <div className="flex items-center justify-between gap-4">
                <StatusBadge label={item.status} />
                <p className="text-sm text-[var(--text-secondary)]">
                  {item.detail ?? 'Review details are available in progress updates.'}
                </p>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}
