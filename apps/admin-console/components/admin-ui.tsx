import type { ReactNode } from 'react';

type AdminPageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageLayout({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children
}: AdminPageLayoutProps) {
  return (
    <div className="space-y-6">
      <header className="admin-page-header admin-surface">
        <div className="admin-page-header__content">
          <div className="admin-page-header__copy">
            {eyebrow ? (
              <p className="admin-page-header__eyebrow">{eyebrow}</p>
            ) : null}
            <h1 className="admin-page-header__title">{title}</h1>
            {description ? (
              <p className="admin-page-header__description">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="admin-page-header__actions">{actions}</div> : null}
        </div>
        {meta ? <div className="admin-page-header__meta">{meta}</div> : null}
      </header>

      {children}
    </div>
  );
}

type AdminActionBarProps = {
  children: ReactNode;
};

export function AdminActionBar({ children }: AdminActionBarProps) {
  return <div className="admin-action-bar admin-surface">{children}</div>;
}

type AdminStatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function AdminStatCard({ label, value, detail }: AdminStatCardProps) {
  return (
    <article className="admin-stat-card admin-surface">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {detail ? <p className="admin-stat-card__detail">{detail}</p> : null}
    </article>
  );
}

type AdminEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AdminEmptyState({
  title,
  description,
  action
}: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state admin-surface">
      <div className="admin-empty-state__icon" aria-hidden="true">
        •
      </div>
      <h3 className="admin-empty-state__title">{title}</h3>
      <p className="admin-empty-state__description">{description}</p>
      {action ? <div className="admin-empty-state__action">{action}</div> : null}
    </div>
  );
}

type AdminInfoStateProps = {
  title: string;
  description: string;
};

export function AdminLoadingState({
  title = 'Loading workspace',
  description = 'Fetching the latest administrative data.'
}: Partial<AdminInfoStateProps>) {
  return (
    <div className="admin-info-state admin-surface">
      <div className="admin-info-state__pulse" aria-hidden="true" />
      <div>
        <h3 className="admin-info-state__title">{title}</h3>
        <p className="admin-info-state__description">{description}</p>
      </div>
    </div>
  );
}

export function AdminErrorState({ title, description }: AdminInfoStateProps) {
  return (
    <div className="admin-error-state admin-surface">
      <h3 className="admin-info-state__title">{title}</h3>
      <p className="admin-info-state__description">{description}</p>
    </div>
  );
}
