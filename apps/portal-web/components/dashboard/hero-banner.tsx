'use client';

import { Button } from '@payer-portal/ui';
import { useRouter } from 'next/navigation';

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });
}

function maskMemberId(memberId: string) {
  const cleaned = memberId.replace(/[^a-zA-Z0-9]/g, '');
  if (!cleaned) {
    return '****-****';
  }

  const lastFour = cleaned.slice(-4).padStart(4, '*');
  return `****-****-${lastFour}`;
}

export function HeroBanner({
  deductibleCurrent,
  deductibleTotal,
  memberName,
  memberNumber,
  nextAction,
  pcpName,
  planName,
  recentClaimStatus,
  coverageStatus
}: {
  deductibleCurrent: number;
  deductibleTotal: number;
  coverageStatus: string;
  memberName: string;
  memberNumber: string;
  nextAction: string;
  pcpName: string;
  planName: string;
  recentClaimStatus: string;
}) {
  const router = useRouter();
  const greeting = getGreeting();
  const planSummary = `${planName} - ${coverageStatus}`;
  const deductibleProgress = deductibleTotal > 0 ? Math.round((deductibleCurrent / deductibleTotal) * 100) : 0;
  const normalizedDeductibleProgress = Math.max(0, Math.min(100, deductibleProgress));

  return (
    <header className="portal-card px-6 py-6 sm:px-8" aria-label="Dashboard overview">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
        <section className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">
            Member dashboard
          </p>
          <h1 className="mt-2 text-[30px] font-semibold leading-tight text-[var(--text-primary)]">
            {greeting} {memberName}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{planSummary}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="medium"
              variant="primary"
              className="active:scale-[0.98]"
              onClick={() => router.push('/dashboard/id-card')}
            >
              View ID Card
            </Button>
            <Button
              size="medium"
              variant="secondary"
              className="active:scale-[0.98]"
              onClick={() => router.push('/dashboard/providers')}
            >
              Find Care
            </Button>
            <Button
              size="medium"
              variant="outline"
              className="active:scale-[0.98]"
              onClick={() => router.push('/dashboard/claims')}
            >
              Check Claims
            </Button>
          </div>
        </section>

        <aside className="rounded-2xl border border-[var(--border-subtle)] bg-slate-50/70 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">My coverage snapshot</h2>

          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-[var(--text-muted)]">Coverage status</dt>
              <dd className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {coverageStatus}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-[var(--text-muted)]">Member ID</dt>
              <dd className="text-sm font-semibold text-[var(--text-primary)]">{maskMemberId(memberNumber)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-[var(--text-muted)]">PCP on file</dt>
              <dd className="text-sm font-semibold text-[var(--text-primary)]">{pcpName}</dd>
            </div>
          </dl>

          <section className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-white p-4" aria-label="Deductible progress">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">Deductible progress</p>
              <p className="text-xs font-semibold text-[var(--text-muted)]">{normalizedDeductibleProgress}% met</p>
            </div>
            <div
              className="mt-2 h-2 rounded-full bg-slate-200"
              role="progressbar"
              aria-label="Deductible progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={normalizedDeductibleProgress}
            >
              <div
                className="h-2 rounded-full bg-[var(--tenant-primary-color)]"
                style={{ width: `${normalizedDeductibleProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              {formatCurrency(deductibleCurrent)} of {formatCurrency(deductibleTotal)}
            </p>
          </section>

          <dl className="mt-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-sm text-[var(--text-muted)]">Recent claim</dt>
              <dd className="text-right text-sm font-semibold text-[var(--text-primary)]">{recentClaimStatus}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-sm text-[var(--text-muted)]">Next action</dt>
              <dd className="text-right text-sm font-semibold text-[var(--text-primary)]">{nextAction}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </header>
  );
}
