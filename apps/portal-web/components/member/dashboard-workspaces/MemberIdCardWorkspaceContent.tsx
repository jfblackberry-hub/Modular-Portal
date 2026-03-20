'use client';

import { useState } from 'react';

import { formatDate } from '../../../lib/portal-format';
import { InlineButton, PageHeader, SurfaceCard, StatusBadge } from '../../portal-ui';

export function MemberIdCardWorkspaceContent({
  effectiveDate,
  embedded = false,
  groupNumber,
  issuerName,
  logoUrl,
  memberId,
  memberName,
  planName,
  rxBin,
  rxGrp,
  rxPcn,
  supportEmail,
  supportPhone,
  terminationDate,
  updatedAt
}: {
  effectiveDate?: string;
  embedded?: boolean;
  groupNumber: string;
  issuerName: string;
  logoUrl?: string;
  memberId: string;
  memberName: string;
  planName: string;
  rxBin: string;
  rxGrp: string;
  rxPcn: string;
  supportEmail: string;
  supportPhone: string;
  terminationDate?: string | null;
  updatedAt?: string;
}) {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const coverageStatus = terminationDate ? `Terminated ${formatDate(terminationDate)}` : 'Active';

  return (
    <div className="space-y-6">
      {embedded ? null : (
        <PageHeader
          eyebrow="ID card"
          title="Digital member ID card"
          description="Keep your member and plan information available for appointments, pharmacy visits, and care coordination."
          actions={<InlineButton href="/dashboard/providers">Find care</InlineButton>}
        />
      )}

      <div className="space-y-6">
        <section className="space-y-5">
          <div className="rounded-[28px] border border-[var(--border-subtle)] bg-white p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Member ID card</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {activeSide === 'front' ? 'Front of card' : 'Back of card'}
                </h2>
              </div>
              <div className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-page)] p-1">
                <button
                  type="button"
                  onClick={() => setActiveSide('front')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeSide === 'front'
                      ? 'bg-[var(--tenant-primary-color)] text-white'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide('back')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeSide === 'back'
                      ? 'bg-[var(--tenant-primary-color)] text-white'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>

            {activeSide === 'front' ? (
              <article
                className="relative mt-5 aspect-[1.72/1] max-w-[42rem] overflow-hidden rounded-[28px] border border-slate-200 p-7 text-white shadow-xl"
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
                    <h3 className="mt-3 text-xl font-semibold">{issuerName}</h3>
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
                  <CardValue label="Effective date" value={effectiveDate ? formatDate(effectiveDate) : 'Unavailable'} />
                </div>

                <div className="relative mt-6 flex items-center justify-between gap-6">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">RX BIN / PCN / GRP</p>
                    <p className="mt-1 font-mono text-sm tracking-wide">{rxBin} / {rxPcn} / {rxGrp}</p>
                  </div>
                  <div className="h-10 w-16 rounded-md bg-white/90" />
                </div>
              </article>
            ) : (
              <article className="relative mt-5 aspect-[1.72/1] max-w-[42rem] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-md">
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

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <BackValue label="Member services" value={supportPhone} />
                    <BackValue label="Support email" value={supportEmail} />
                    <BackValue label="24/7 nurse line" value="Call member services for urgent clinical guidance" />
                    <BackValue label="Virtual care" value="Use Find Care to access telehealth and urgent care options" />
                    <BackValue label="Issuer" value={issuerName} />
                    <BackValue label="Coverage status" value={coverageStatus} />
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-5 text-[var(--text-secondary)]">
                    Present this card at each visit. Eligibility and benefits are verified in real time and may change based on your current coverage.
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SurfaceCard title="Cardholder details" description="These values are pulled from your active member profile and coverage feed.">
            <div className="mb-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3">
              <PlanLogo logoUrl={logoUrl} issuerName={issuerName} />
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
              <MetaTile label="Member name" value={memberName} />
              <MetaTile label="Member ID" value={memberId} />
              <MetaTile label="Group number" value={groupNumber} />
              <MetaTile label="Plan" value={planName} />
              <MetaTile label="Member services" value={supportPhone} />
              <MetaTile label="Last profile refresh" value={updatedAt ? formatDate(updatedAt) : 'Unavailable'} />
            </dl>
          </SurfaceCard>

          <div className="space-y-4">
            <SurfaceCard title="Support and care access" description="Use these details when you need help, care navigation, or benefits support.">
              <dl className="grid gap-3 text-sm">
                <MetaRow label="Member services" value={supportPhone} />
                <MetaRow label="Support email" value={supportEmail} />
                <MetaRow label="Virtual care" value="Find Care and telehealth support available in your member tools" />
                <MetaRow label="Coverage status" value={coverageStatus} />
              </dl>
            </SurfaceCard>

            <SurfaceCard title="Coverage indicators">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={terminationDate ? 'Inactive' : 'Active'} />
                <StatusBadge label={planName} />
              </div>
            </SurfaceCard>
          </div>
        </section>
      </div>
    </div>
  );
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

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-4">
      <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{value}</dd>
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
