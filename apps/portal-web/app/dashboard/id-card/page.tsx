import { getMe, getMemberCoverage, getMemberProfile } from '../../../lib/member-api';
import { formatDate } from '../../../lib/portal-format';
import { InlineButton, PageHeader, SurfaceCard } from '../../../components/portal-ui';

export default async function IdCardPage() {
  const [me, profile, coverage] = await Promise.all([
    getMe(),
    getMemberProfile(),
    getMemberCoverage()
  ]);

  const member = profile ?? me?.member;
  const plan = coverage?.items[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ID card"
        title="Digital member ID card"
        description="Keep your member and plan information available for appointments, pharmacy visits, and care coordination."
        actions={<InlineButton href="/dashboard/providers">Find care</InlineButton>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="portal-shell-gradient rounded-[28px] p-8 text-white shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm text-sky-100">Member ID card</p>
              <h2 className="mt-4 text-2xl font-semibold">
                {plan?.planName ?? 'Active coverage'}
              </h2>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold">
              Medical
            </div>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-sky-100">Member name</p>
              <p className="mt-2 text-xl font-semibold">
                {member ? `${member.firstName} ${member.lastName}` : 'Unavailable'}
              </p>
            </div>
            <div>
              <p className="text-sm text-sky-100">Member number</p>
              <p className="mt-2 text-xl font-semibold">
                {member?.memberNumber ?? 'Unavailable'}
              </p>
            </div>
            <div>
              <p className="text-sm text-sky-100">Effective date</p>
              <p className="mt-2 text-xl font-semibold">
                {plan ? formatDate(plan.effectiveDate) : 'Unavailable'}
              </p>
            </div>
            <div>
              <p className="text-sm text-sky-100">Rx BIN / PCN</p>
              <p className="mt-2 text-xl font-semibold">610494 / ADV</p>
            </div>
          </div>
        </section>

        <SurfaceCard
          title="Back of card details"
          description="Use this information when calling support or scheduling care."
        >
          <dl className="space-y-4 text-sm">
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              <dt className="font-semibold text-[var(--text-primary)]">Member services</dt>
              <dd className="mt-2 text-[var(--text-secondary)]">1-800-555-0199</dd>
            </div>
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              <dt className="font-semibold text-[var(--text-primary)]">Pharmacy help desk</dt>
              <dd className="mt-2 text-[var(--text-secondary)]">1-800-555-0144</dd>
            </div>
            <div className="rounded-2xl bg-[var(--bg-page)] p-5">
              <dt className="font-semibold text-[var(--text-primary)]">Telehealth</dt>
              <dd className="mt-2 text-[var(--text-secondary)]">Visit dashboard providers for urgent virtual care options.</dd>
            </div>
          </dl>
        </SurfaceCard>
      </div>
    </div>
  );
}
