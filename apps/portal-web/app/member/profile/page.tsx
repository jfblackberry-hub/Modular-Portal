import { getMemberProfile } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';
import { EmptyState, PageHeader, SurfaceCard } from '../../../components/portal-ui';

export default async function MemberProfilePage() {
  const sessionUser = await getPortalSessionUser();
  const profile = await getMemberProfile(sessionUser?.id);

  if (!profile) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="Profile data is unavailable until the local API is running."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member plugin"
        title="Profile"
        description="Member identity and source system information."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ['Full name', `${profile.firstName} ${profile.lastName}`],
          ['Member number', profile.memberNumber],
          ['Date of birth', profile.dob],
          ['Source record', `${profile.sourceSystem} • ${profile.sourceRecordId}`]
        ].map(([label, value]) => (
          <SurfaceCard key={label} title={label}>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{value}</p>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
