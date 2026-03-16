import { getMe, getMemberCoverage, getMemberProfile } from '../../../lib/member-api';
import { getPortalSessionUser } from '../../../lib/portal-session';
import { getTenantBranding } from '../../../lib/tenant-branding';
import { formatDate } from '../../../lib/portal-format';
import { InlineButton, PageHeader, SurfaceCard, StatusBadge } from '../../../components/portal-ui';

export default async function IdCardPage() {
  const sessionUser = await getPortalSessionUser();
  const sessionUserId = sessionUser?.id;
  const [me, profile, coverage] = await Promise.all([
    getMe(sessionUserId),
    getMemberProfile(sessionUserId),
    getMemberCoverage(sessionUserId)
  ]);

  const member = profile ?? me?.member;
  const plan = coverage?.items[0];
  const tenantBranding = sessionUser
    ? await getTenantBranding(sessionUser.tenant, sessionUser.id, {
      experience: 'member'
    })
    : undefined;
  const memberName = member
    ? `${member.firstName} ${member.lastName}`
    : [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(' ') || 'Unavailable';
  const memberId = member?.memberNumber ?? 'Unavailable';
  const groupNumber = toGroupNumber(
    plan?.sourceRecordId ?? sessionUser?.tenant?.id ?? plan?.id
  );
  const issuerName = tenantBranding?.displayName ?? sessionUser?.tenant.name ?? 'Member Health Plan';
  const supportPhone = tenantBranding?.supportPhone ?? '1-800-555-0199';
  const supportEmail = tenantBranding?.supportEmail ?? 'support@portal.local';
  const logoUrl = tenantBranding?.logoUrl;
  const planName = plan?.planName ?? 'Coverage unavailable';
  const rxBin = toRxSegment(groupNumber, 'bin');
  const rxPcn = toRxSegment(groupNumber, 'pcn');
  const rxGrp = toRxSegment(groupNumber, 'grp');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ID card"
        title="Digital member ID card"
        description="Keep your member and plan information available for appointments, pharmacy visits, and care coordination."
        actions={<InlineButton href="/dashboard/providers">Find care</InlineButton>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <article
            className="relative overflow-hidden rounded-[28px] border border-slate-200 p-7 text-white shadow-xl"
            style={{
              backgroundImage:
                'linear-gradient(135deg, color-mix(in srgb, var(--tenant-primary-color) 78%, #0f172a), color-mix(in srgb, var(--tenant-secondary-color) 45%, var(--tenant-primary-color)))'
            }}
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/85">Member ID card</p>
                <h2 className="mt-3 text-xl font-semibold">{issuerName}</h2>
                <p className="mt-1 text-sm text-white/90">{planName}</p>
              </div>
              <div className="flex items-start gap-2">
                <PlanLogo logoUrl={logoUrl} issuerName={issuerName} />
                <div className="rounded-2xl border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
                  Medical
                </div>
              </div>
            </div>

            <div className="relative mt-8 grid gap-4 sm:grid-cols-2">
              <CardValue label="Member name" value={memberName.toUpperCase()} />
              <CardValue label="Member ID" value={memberId} />
              <CardValue label="Group number" value={groupNumber} />
              <CardValue
                label="Effective date"
                value={plan ? formatDate(plan.effectiveDate) : 'Unavailable'}
              />
            </div>

            <div className="relative mt-6 flex items-center justify-between gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">RX BIN / PCN / GRP</p>
                <p className="mt-1 font-mono text-sm tracking-wide">{rxBin} / {rxPcn} / {rxGrp}</p>
              </div>
              <div className="h-10 w-16 rounded-md bg-white/90" />
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-md">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 15%, var(--tenant-primary-soft-color), transparent 42%), radial-gradient(circle at 90% 90%, var(--tenant-secondary-soft-color), transparent 40%)'
              }}
            />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Back of card</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">Support and care access</h3>

              <div className="mt-5 grid gap-4">
                <BackValue label="Member services" value={supportPhone} />
                <BackValue label="Support email" value={supportEmail} />
                <BackValue label="Issuer" value={issuerName} />
                <BackValue
                  label="Coverage status"
                  value={plan?.terminationDate ? `Terminated ${formatDate(plan.terminationDate)}` : 'Active'}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-5 text-[var(--text-secondary)]">
                Present this card at each visit. Eligibility and benefits are verified in real time and may change based on your current coverage.
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-4">
          <SurfaceCard
            title="Cardholder details"
            description="These values are pulled from your active member profile and coverage feed."
          >
            <div className="mb-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3">
              <PlanLogo logoUrl={logoUrl} issuerName={issuerName} />
            </div>
            <dl className="grid gap-3 text-sm">
              <MetaRow label="Member name" value={memberName} />
              <MetaRow label="Date of birth" value={member ? formatDate(member.dob) : 'Unavailable'} />
              <MetaRow label="Member ID" value={memberId} />
              <MetaRow label="Group number" value={groupNumber} />
              <MetaRow label="Plan" value={planName} />
              <MetaRow
                label="Last profile refresh"
                value={member ? formatDate(member.updatedAt) : 'Unavailable'}
              />
            </dl>
          </SurfaceCard>

          <SurfaceCard title="Coverage indicators">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={plan?.terminationDate ? 'Inactive' : 'Active'} />
              <StatusBadge label={plan?.sourceSystem ?? 'Unknown source'} />
              <StatusBadge label={planName} />
            </div>
          </SurfaceCard>
        </section>
      </div>
    </div>
  );
}

function toGroupNumber(value?: string) {
  if (!value) {
    return 'Unavailable';
  }

  const normalized = value.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (!normalized) {
    return 'Unavailable';
  }

  if (normalized.length < 9) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
}

function toRxSegment(value: string, type: 'bin' | 'pcn' | 'grp') {
  const seed = value.replace(/[^a-z0-9]/gi, '').toUpperCase().padEnd(10, '0');
  if (type === 'bin') {
    const numeric = seed
      .slice(0, 6)
      .split('')
      .map((char) => (/\d/.test(char) ? char : String(char.charCodeAt(0) % 10)))
      .join('');
    return numeric;
  }

  if (type === 'pcn') {
    return seed.slice(0, 3);
  }

  return `RX${seed.slice(0, 5)}`;
}

function CardValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function BackValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2 last:border-none">
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-right font-semibold text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function PlanLogo({
  logoUrl,
  issuerName
}: {
  logoUrl?: string;
  issuerName: string;
}) {
  const initials = issuerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join('');

  if (logoUrl) {
    return (
      <div className="flex h-12 items-center rounded-xl border border-white/40 bg-white px-3">
        <img src={logoUrl} alt={`${issuerName} logo`} className="h-7 w-auto object-contain" />
      </div>
    );
  }

  return (
    <div className="inline-flex h-12 min-w-12 items-center justify-center rounded-xl border border-white/35 bg-white/20 px-3 text-sm font-semibold tracking-wide text-white">
      {initials || 'HP'}
    </div>
  );
}
