import Link from 'next/link';
import type { ReactNode } from 'react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const toneStyles: Record<Tone, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700'
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="tenant-page-header portal-card px-6 py-6 sm:px-8">
      <div className="tenant-page-header__content flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="tenant-page-header__copy max-w-3xl lg:flex-1 lg:pr-8">
          {eyebrow ? (
            <p className="tenant-page-header__eyebrow text-[13px] font-medium text-[var(--tenant-primary-color)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="tenant-page-header__title mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="tenant-page-header__description mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="tenant-page-header__actions flex flex-wrap gap-3 lg:min-w-fit lg:justify-end lg:self-start">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SurfaceCard({
  title,
  description,
  children,
  action
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="tenant-surface-card portal-card p-6">
      <div className="tenant-surface-card__header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="tenant-surface-card__copy">
          <h2 className="tenant-surface-card__title text-[20px] font-semibold text-[var(--text-primary)]">
            {title}
          </h2>
          {description ? (
            <p className="tenant-surface-card__description mt-2 text-[15px] leading-6 text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="tenant-surface-card__action">{action}</div> : null}
      </div>
      <div className="tenant-surface-card__body mt-5">{children}</div>
    </section>
  );
}

export function QuickActionCard({
  href,
  label,
  description,
  icon
}: {
  href: string;
  label: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="tenant-quick-action-card portal-card group block p-5 transition hover:-translate-y-0.5 hover:border-[var(--tenant-primary-color)] hover:shadow-md"
    >
      <div className="tenant-quick-action-card__content flex items-center gap-4">
        <div className="tenant-quick-action-card__icon flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--tenant-primary-soft-color)] text-xl text-[var(--tenant-primary-color)]">
          <span aria-hidden="true">{icon}</span>
        </div>
        <div className="tenant-quick-action-card__copy">
          <h3 className="tenant-quick-action-card__label text-base font-semibold text-[var(--text-primary)]">
            {label}
          </h3>
          <p className="tenant-quick-action-card__description mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'default',
  href,
  ctaLabel,
  previewItems
}: {
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
  href?: string;
  ctaLabel?: string;
  previewItems?: string[];
}) {
  const content = (
    <>
      <span
        className={`tenant-stat-card__badge tenant-status-badge tenant-status-badge--${tone} inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${toneStyles[tone]}`}
      >
        {label}
      </span>
      <p className="tenant-stat-card__value mt-4 text-3xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="tenant-stat-card__detail mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {detail}
      </p>
      {previewItems && previewItems.length > 0 ? (
        <div className="tenant-stat-card__preview mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-4">
          {previewItems.slice(0, 3).map((item) => (
            <p key={item} className="tenant-stat-card__preview-item text-xs leading-5 text-[var(--text-muted)]">
              {item}
            </p>
          ))}
        </div>
      ) : null}
      {href && ctaLabel ? (
        <div className="tenant-stat-card__cta mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 text-sm font-semibold text-[var(--tenant-primary-color)]">
          <span className="tenant-stat-card__cta-label">{ctaLabel}</span>
          <span className="tenant-stat-card__cta-icon" aria-hidden="true">→</span>
        </div>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="tenant-stat-card portal-card block p-5 transition hover:border-[var(--tenant-primary-color)] hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return <article className="tenant-stat-card portal-card p-5">{content}</article>;
}

export function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const tone: Tone = normalized.includes('approve') || normalized.includes('paid')
    ? 'success'
    : normalized.includes('pending') || normalized.includes('review')
      ? 'warning'
      : normalized.includes('deny') || normalized.includes('error')
        ? 'danger'
        : 'info';

  return (
    <span
      className={`tenant-status-badge tenant-status-badge--${tone} inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${toneStyles[tone]}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}

export function ProgressMeter({
  label,
  current,
  total,
  helper
}: {
  label: string;
  current: number;
  total: number;
  helper: string;
}) {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <article className="tenant-progress-meter portal-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="tenant-progress-meter__title text-base font-semibold text-[var(--text-primary)]">
            {label}
          </h3>
          <p className="tenant-progress-meter__helper mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {helper}
          </p>
        </div>
        <p className="tenant-progress-meter__percent text-sm font-semibold text-[var(--tenant-primary-color)]">
          {percentage}%
        </p>
      </div>
      <div className="tenant-progress-meter__track mt-5 h-3 rounded-full bg-slate-100">
        <div
          className="tenant-progress-meter__fill h-3 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: 'var(--tenant-primary-color)'
          }}
        />
      </div>
      <div className="tenant-progress-meter__values mt-3 flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <span className="tenant-progress-meter__value">${current.toLocaleString()}</span>
        <span className="tenant-progress-meter__value">${total.toLocaleString()}</span>
      </div>
    </article>
  );
}

export function SupportLink({
  href,
  label,
  description
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="tenant-support-link portal-card block p-5 transition hover:border-[var(--tenant-primary-color)] hover:shadow-md"
    >
      <h3 className="tenant-support-link__label text-base font-semibold text-[var(--text-primary)]">{label}</h3>
      <p className="tenant-support-link__description mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </Link>
  );
}

export function InlineButton({
  href,
  tone = 'primary',
  children
}: {
  href: string;
  tone?: 'primary' | 'secondary' | 'tertiary';
  children: ReactNode;
}) {
  const className =
    tone === 'primary'
      ? 'bg-[var(--tenant-primary-color)] text-white hover:brightness-110'
      : tone === 'secondary'
        ? 'border border-[var(--tenant-primary-color)] bg-white text-[var(--tenant-primary-color)] hover:bg-sky-50'
        : 'text-[var(--tenant-primary-color)] hover:text-[var(--primary-900)]';

  return (
    <Link
      href={href}
      className={`tenant-inline-button tenant-inline-button--${tone} inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${className}`}
    >
      {children}
    </Link>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="tenant-empty-state portal-card border-dashed p-8 text-center">
      <h3 className="tenant-empty-state__title text-xl font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="tenant-empty-state__description mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
