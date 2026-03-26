'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import type {
  ProviderOperationsAttentionItem,
  ProviderOperationsOrganizationUnitOption,
  ProviderOperationsQuickAction,
  ProviderOperationsSummaryMetric,
  ProviderOperationsWidgetTone
} from '@payer-portal/api-contracts';

const toneStyles: Record<ProviderOperationsWidgetTone, string> = {
  default: 'tenant-status-chip--info',
  success: 'tenant-status-chip--success',
  warning: 'tenant-status-chip--warning',
  danger: 'tenant-status-chip--critical',
  info: 'tenant-status-chip--info'
};

const urgencyStyles: Record<ProviderOperationsAttentionItem['urgency'], string> = {
  critical: 'border-rose-200 bg-rose-50/80 text-rose-800',
  high: 'border-amber-200 bg-amber-50/80 text-amber-800',
  medium: 'border-sky-200 bg-sky-50/80 text-sky-800',
  steady: 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
};

const urgencyThemeClasses: Record<ProviderOperationsAttentionItem['urgency'], string> = {
  critical: 'is-critical',
  high: 'is-warning',
  medium: '',
  steady: 'is-positive'
};

export type PriorityBriefRow = {
  title: string;
  why: string;
  action: string;
  href: string;
};

export function CommandCenterShell({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="tenant-home-shell">
      <div className="tenant-home-layer space-y-6 pb-8">{children}</div>
    </div>
  );
}

export function CommandCenterHero({
  alertCount,
  clinicName,
  briefRows,
  providerName,
  stats
}: {
  alertCount: number;
  clinicName: string;
  briefRows: PriorityBriefRow[];
  providerName: string;
  stats: Array<{ label: string; value: string; detail: string }>;
}) {
  const heroLeftRef = useRef<HTMLDivElement | null>(null);
  const [insightsHeight, setInsightsHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = heroLeftRef.current;
    if (!element) {
      return;
    }

    const updateHeight = () => {
      const nextHeight = Math.round(element.getBoundingClientRect().height);
      if (nextHeight > 0) {
        setInsightsHeight(nextHeight);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <section className="tenant-hero-panel px-6 py-6 sm:px-7 sm:py-7">
      <div className="tenant-hero-row">
        <div ref={heroLeftRef} className="tenant-hero-left space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="#attention-now-end" className="tenant-hero-pill">
              {alertCount} alerts in motion
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <p className="tenant-hero-kicker">Operational home</p>
              <h1 className="tenant-hero-title mt-3 !text-white text-[2.4rem] font-semibold leading-[1.02]">
                {clinicName}
              </h1>
            </div>

            <p className="tenant-hero-copy max-w-3xl text-[1rem] leading-7">
              Work that affects children, families, schedules, authorizations, and revenue is
              active right now. This home screen is designed to make the pressure visible, keep
              priorities understandable, and move office staff straight into action.
            </p>
            <p className="text-sm font-semibold text-white/88">
              Signed in as {providerName}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <article key={stat.label} className="tenant-hero-stat px-4 py-4">
                <p className="tenant-hero-stat__label">{stat.label}</p>
                <p className="tenant-hero-stat__value mt-3">{stat.value}</p>
                <p className="tenant-hero-stat__detail mt-2">{stat.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="tenant-hero-right">
          <div
            className="tenant-hero-insights-panel px-4 py-4"
            style={insightsHeight ? { height: `${insightsHeight}px` } : undefined}
          >
            <div className="tenant-hero-insights-header flex items-start gap-4">
              <div className="flex items-center gap-2.5">
                <span className="averra-platform-logo h-5 w-5 shrink-0" aria-hidden="true">
                  <img src="/branding/averra_logo_cutout.svg" alt="" />
                </span>
                <h2 className="tenant-hero-insights-heading !text-white text-[1.35rem] font-semibold tracking-[-0.02em]">
                  averra Insights
                </h2>
              </div>
            </div>
            <div className="tenant-hero-insights-body mt-4 pr-2">
              {briefRows.slice(0, 6).map((item) => (
                <Link
                  key={item.title}
                  href={item.href ?? '/provider/dashboard'}
                  className="group block border-b border-white/12 py-3 last:border-b-0"
                >
                  <p className="tenant-hero-insights-title">{item.title}</p>
                  <p className="tenant-hero-insights-copy mt-2">
                    <span className="tenant-hero-insights-label">
                      Why it matters:
                    </span>{' '}
                    {item.why}
                  </p>
                  <p className="tenant-hero-insights-copy mt-2">
                    <span className="tenant-hero-insights-label">
                      Recommended action:
                    </span>{' '}
                    {item.action}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatUrgencyLabel(urgency: ProviderOperationsAttentionItem['urgency']) {
  if (urgency === 'steady') {
    return 'No Risk';
  }

  return urgency[0]?.toUpperCase() + urgency.slice(1);
}

function getAttentionActionLabel(item: ProviderOperationsAttentionItem) {
  const label = item.label.toLowerCase();

  if (label.includes('eligibility')) {
    return 'Fix eligibility';
  }
  if (label.includes('auth')) {
    return 'Check auths';
  }
  if (label.includes('resubmission')) {
    return 'Work resubmissions';
  }
  if (label.includes('claim')) {
    return 'Resolve claims';
  }
  if (label.includes('gap') || label.includes('open slot')) {
    return 'Fill open slot';
  }
  if (label.includes('session')) {
    return 'Review sessions';
  }

  return 'Review details';
}

export function CommandCenterHeader({
  alertsCount,
  lastRefreshedLabel,
  organizationUnits,
  quickActions,
  quickActionsOpen,
  setQuickActionsOpen
}: {
  alertsCount: number;
  lastRefreshedLabel: string;
  organizationUnits: ProviderOperationsOrganizationUnitOption[];
  quickActions: ProviderOperationsQuickAction[];
  quickActionsOpen: boolean;
  setQuickActionsOpen: (value: boolean) => void;
}) {
  const activeOrganizationUnit =
    organizationUnits.find((organizationUnit) => organizationUnit.isActive) ?? null;

  return (
    <section className="command-center-header tenant-section-shell portal-card dashboard-card overflow-hidden px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="tenant-status-chip tenant-status-chip--critical">
              {alertsCount} alerts
            </span>
            <span className="tenant-status-chip tenant-status-chip--info">
              Last refreshed {lastRefreshedLabel}
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className="button button-primary inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--tenant-primary-color)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Quick actions
            </button>
            {quickActionsOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-[var(--border-subtle)] bg-white p-3 shadow-[var(--shadow-surface-strong)]">
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="block rounded-xl border border-transparent px-3 py-3 transition hover:border-[var(--tenant-primary-color)] hover:bg-slate-50"
                    >
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {action.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                        {action.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 lg:ml-auto lg:max-w-[440px] lg:grid-cols-[minmax(260px,0.75fr)_minmax(160px,auto)]">
          <label className="tenant-subcard rounded-2xl px-4 py-3">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Organization unit
            </span>
            <select
              disabled
              value={activeOrganizationUnit?.id ?? ''}
              className="w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none disabled:opacity-100"
            >
              {organizationUnits.map((organizationUnit) => (
                <option key={organizationUnit.id} value={organizationUnit.id}>
                  {organizationUnit.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Session scope is fixed for this sign-in.
            </p>
          </label>

          <div className="tenant-subcard rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Alerts
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {alertsCount}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Work queues requiring action now
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AttentionStrip({
  items
}: {
  items: ProviderOperationsAttentionItem[];
}) {
  const urgencyOrder: Record<ProviderOperationsAttentionItem['urgency'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    steady: 3
  };
  const orderedItems = [...items].sort((left, right) => {
    const byUrgency = urgencyOrder[left.urgency] - urgencyOrder[right.urgency];
    if (byUrgency !== 0) {
      return byUrgency;
    }

    return right.count - left.count;
  });

  return (
    <section className="attention-strip space-y-3" aria-label="Attention now">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--tenant-primary-color)]">
            Attention now
          </p>
          <h2 className="mt-1 text-[24px] font-semibold text-[var(--text-primary)]">
            What needs action today
          </h2>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {orderedItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`priority-tile tenant-section-shell portal-card dashboard-card block px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--tenant-primary-color)] hover:shadow-[var(--shadow-surface-strong)] ${urgencyThemeClasses[item.urgency]}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                  {item.count} {item.count === 1 ? 'item' : 'items'} need review. {item.summary}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${urgencyStyles[item.urgency]}`}
              >
                {formatUrgencyLabel(item.urgency)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm font-semibold text-[var(--tenant-primary-color)]">
              <span>{getAttentionActionLabel(item)}</span>
              <span aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
      <div id="attention-now-end" className="h-px scroll-mt-24" aria-hidden="true" />
    </section>
  );
}

export function SummaryMetricGrid({
  metrics
}: {
  metrics: ProviderOperationsSummaryMetric[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Link
          key={metric.id}
          href={metric.href}
          className="tenant-subcard block rounded-2xl px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--tenant-primary-color)] hover:bg-white hover:shadow-[var(--shadow-floating)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            {metric.label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {metric.value}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {metric.detail}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function CommandCenterSection({
  actions,
  children,
  description,
  title
}: {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="tenant-section-shell portal-card px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">{title}</h2>
            <p className="mt-2 text-[15px] leading-7 text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function ToneBadge({
  label,
  tone
}: {
  label: string;
  tone: ProviderOperationsWidgetTone;
}) {
  return (
    <span
      className={`tenant-status-chip ${toneStyles[tone]}`}
    >
      {label}
    </span>
  );
}

export function DetailDrawer({
  children,
  onClose,
  title
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
        aria-label="Close detail drawer"
      />
      <aside className="relative z-10 h-full w-full max-w-[820px] overflow-y-auto border-l border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-surface-strong)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">
              Drill-down
            </p>
            <h3 className="mt-2 text-[28px] font-semibold text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--tenant-primary-color)] hover:text-[var(--tenant-primary-color)]"
          >
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </aside>
    </div>
  );
}
