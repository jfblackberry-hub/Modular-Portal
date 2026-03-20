'use client';

import { EmptyState, PageHeader, StatusBadge, SurfaceCard } from '../../portal-ui';
import { formatDate } from '../../../lib/portal-format';

type AuthorizationItem = {
  detail?: string | null;
  id: string;
  service: string;
  status: string;
  submittedOn: string;
};

export function MemberAuthorizationsWorkspaceContent({
  embedded = false,
  items
}: {
  embedded?: boolean;
  items: AuthorizationItem[];
}) {
  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          eyebrow="Authorizations"
          title="Prior authorizations"
          description="Track service requests, decision status, and any documents needed to keep care moving."
        />
      )}
      {items.length === 0 ? (
        <EmptyState
          title="No authorizations available"
          description="Prior authorization requests will appear here when available."
        />
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <SurfaceCard key={item.id} title={item.service} description={`Submitted ${formatDate(item.submittedOn)}`}>
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
