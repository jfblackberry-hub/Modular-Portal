'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EmptyState, StatusBadge } from '../portal-ui';
import { PortalHeroBanner } from '../shared/portal-hero-banner';

type DashboardMode = 'live' | 'mock' | 'empty' | 'error';

type ActionItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  href: string;
};

type DocumentItem = {
  id: string;
  title: string;
  type: string;
  date: string;
};

type NoticeItem = {
  id: string;
  title: string;
  detail: string;
  status: string;
  date: string;
};

type BillingEnrollmentDashboardData = {
  coverageStatus: {
    label: string;
    planName: string;
    effectiveDate: string;
  };
  enrollmentProgress: {
    completedSteps: number;
    totalSteps: number;
    currentStep: string;
  };
  nextPremiumDue: {
    amount: string;
    dueDate: string;
    status: string;
  };
  paymentMethod: {
    label: string;
    autopayEnabled: boolean;
    lastPaymentDate: string;
  };
  openActionItems: ActionItem[];
  recentDocuments: DocumentItem[];
  recentNotices: NoticeItem[];
};

function getMockData(): BillingEnrollmentDashboardData {
  return {
    coverageStatus: {
      label: 'Active',
      planName: 'Gold PPO 1500',
      effectiveDate: 'Apr 1, 2026'
    },
    enrollmentProgress: {
      completedSteps: 3,
      totalSteps: 5,
      currentStep: 'Upload household verification'
    },
    nextPremiumDue: {
      amount: '$412.33',
      dueDate: 'Apr 1, 2026',
      status: 'Open'
    },
    paymentMethod: {
      label: 'Visa ending 2048',
      autopayEnabled: true,
      lastPaymentDate: 'Mar 1, 2026'
    },
    openActionItems: [
      {
        id: 'action-1',
        title: 'Upload proof of income',
        detail: 'Required for household eligibility verification',
        status: 'Needs Info',
        href: '/dashboard/billing-enrollment/documents'
      },
      {
        id: 'action-2',
        title: 'Review selected plan',
        detail: 'Confirm plan option before final enrollment submission',
        status: 'Pending',
        href: '/dashboard/billing-enrollment/plans'
      },
      {
        id: 'action-3',
        title: 'Set up autopay',
        detail: 'Recommended to avoid missed premium due dates',
        status: 'Recommended',
        href: '/dashboard/billing-enrollment/payments'
      }
    ],
    recentDocuments: [
      { id: 'doc-1', title: 'Income Verification Form', type: 'PDF', date: 'Mar 12, 2026' },
      { id: 'doc-2', title: 'Enrollment Application', type: 'PDF', date: 'Mar 10, 2026' }
    ],
    recentNotices: [
      {
        id: 'notice-1',
        title: 'Premium Payment Reminder',
        detail: 'Your next payment is due on Apr 1, 2026.',
        status: 'Open',
        date: 'Mar 14, 2026'
      },
      {
        id: 'notice-2',
        title: 'Document Requirement Update',
        detail: 'One additional document is needed for enrollment completion.',
        status: 'Action Required',
        date: 'Mar 13, 2026'
      }
    ]
  };
}

function getEmptyData(): BillingEnrollmentDashboardData {
  return {
    coverageStatus: {
      label: 'Not Started',
      planName: 'No plan selected',
      effectiveDate: 'N/A'
    },
    enrollmentProgress: {
      completedSteps: 0,
      totalSteps: 5,
      currentStep: 'Start enrollment'
    },
    nextPremiumDue: {
      amount: '$0.00',
      dueDate: 'N/A',
      status: 'No balance'
    },
    paymentMethod: {
      label: 'No payment method on file',
      autopayEnabled: false,
      lastPaymentDate: 'N/A'
    },
    openActionItems: [],
    recentDocuments: [],
    recentNotices: []
  };
}

function LoadingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="portal-card animate-pulse p-5">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-32 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-28 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function BillingEnrollmentDashboard({
  heroImageSrc,
  mode = 'live'
}: {
  heroImageSrc: string;
  mode?: DashboardMode;
}) {
  const [isLoading, setIsLoading] = useState(mode === 'live');
  const [error, setError] = useState('');
  const [data, setData] = useState<BillingEnrollmentDashboardData | null>(
    mode === 'mock' ? getMockData() : mode === 'empty' ? getEmptyData() : null
  );

  const enrollmentPercent = useMemo(() => {
    if (!data) {
      return 0;
    }

    if (data.enrollmentProgress.totalSteps === 0) {
      return 0;
    }

    return Math.round((data.enrollmentProgress.completedSteps / data.enrollmentProgress.totalSteps) * 100);
  }, [data]);

  const loadData = useCallback(async () => {
    if (mode === 'mock') {
      setData(getMockData());
      setError('');
      setIsLoading(false);
      return;
    }

    if (mode === 'empty') {
      setData(getEmptyData());
      setError('');
      setIsLoading(false);
      return;
    }

    if (mode === 'error') {
      setData(null);
      setError('Unable to load Billing & Enrollment data right now.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/billing-enrollment/overview', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Unable to load Billing & Enrollment data right now.');
      }

      const payload = (await response.json()) as {
        enrollmentCases?: unknown[];
        invoices?: unknown[];
        payments?: unknown[];
        documentRequirements?: unknown[];
        notices?: unknown[];
      };

      // Use live payload counts while rendering stable mock-friendly dashboard content.
      const base = getMockData();
      setData({
        ...base,
        openActionItems:
          (payload.documentRequirements?.length ?? 0) > 0
            ? base.openActionItems
            : [],
        recentDocuments:
          (payload.documentRequirements?.length ?? 0) > 0
            ? base.recentDocuments
            : [],
        recentNotices:
          (payload.notices?.length ?? 0) > 0
            ? base.recentNotices
            : []
      });
    } catch (nextError) {
      setData(getMockData());
      setError(nextError instanceof Error ? nextError.message : 'Unable to load Billing & Enrollment data right now.');
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-5" aria-busy={isLoading}>
      <section className="portal-card overflow-hidden p-0">
        <PortalHeroBanner
          eyebrow="Billing & Enrollment"
          title="Manage your coverage, enrollment, and payments in one place"
          description="Complete enrollment tasks, review premium obligations, and manage correspondence without leaving your tenant experience."
          imageSrc={heroImageSrc}
          imageDecorative
          priority
          actions={
            <>
              <Link
                href="/dashboard/billing-enrollment/enrollment"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Continue Enrollment
              </Link>
              <Link
                href="/dashboard/billing-enrollment/payments"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--tenant-primary-color)] bg-white px-5 py-3 text-sm font-semibold text-[var(--tenant-primary-color)] transition hover:bg-sky-50"
              >
                Pay My Bill
              </Link>
            </>
          }
        />
      </section>

      {error ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="status" aria-live="polite">
          {error}
        </section>
      ) : null}

      {isLoading || !data ? (
        <LoadingCards />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="portal-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Coverage Status</p>
            <div className="mt-3">
              <StatusBadge label={data.coverageStatus.label} />
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{data.coverageStatus.planName}</p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Effective {data.coverageStatus.effectiveDate}</p>
          </article>

          <article className="portal-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Enrollment Progress</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{enrollmentPercent}%</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-[var(--tenant-primary-color)]" style={{ width: `${enrollmentPercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{data.enrollmentProgress.currentStep}</p>
          </article>

          <article className="portal-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Next Premium Due</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{data.nextPremiumDue.amount}</p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Due {data.nextPremiumDue.dueDate}</p>
            <div className="mt-3">
              <StatusBadge label={data.nextPremiumDue.status} />
            </div>
          </article>

          <article className="portal-card p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Payment Method</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">{data.paymentMethod.label}</p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">Last payment: {data.paymentMethod.lastPaymentDate}</p>
            <div className="mt-3">
              <StatusBadge label={data.paymentMethod.autopayEnabled ? 'Autopay Active' : 'Autopay Off'} />
            </div>
          </article>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Open Action Items</h2>
          {!data || data.openActionItems.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No open action items"
                description="You are caught up. New enrollment or billing tasks will appear here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.openActionItems.map((item) => (
                <li key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <StatusBadge label={item.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.detail}</p>
                  <Link href={item.href} className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tenant-primary-color)]">
                    Open task
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { label: 'Shop Plans', href: '/dashboard/billing-enrollment/plans' },
              { label: 'Add Dependent', href: '/dashboard/billing-enrollment/enrollment' },
              { label: 'Make Payment', href: '/dashboard/billing-enrollment/payments' },
              { label: 'Set Up Autopay', href: '/dashboard/billing-enrollment/payments' },
              { label: 'Upload Documents', href: '/dashboard/billing-enrollment/documents' },
              { label: 'View Notices', href: '/dashboard/billing-enrollment/notices' }
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Documents</h2>
          {!data || data.recentDocuments.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No recent documents"
                description="Uploaded enrollment and billing documents will appear here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.recentDocuments.map((document) => (
                <li key={document.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{document.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{document.type} • {document.date}</p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="portal-card p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Notices</h2>
          {!data || data.recentNotices.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No recent notices"
                description="Policy, payment, and enrollment notices will appear here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.recentNotices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{notice.title}</p>
                    <StatusBadge label={notice.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{notice.detail}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{notice.date}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
