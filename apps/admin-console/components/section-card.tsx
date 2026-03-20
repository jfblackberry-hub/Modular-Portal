import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  action,
  children
}: SectionCardProps) {
  return (
    <section className="admin-section-card admin-surface">
      <div className="admin-section-card__header">
        <div className="admin-section-card__copy">
          <h2 className="admin-section-card__title text-xl font-semibold tracking-tight text-admin-text">
            {title}
          </h2>
          {description ? (
            <p className="admin-section-card__description mt-2 text-sm leading-6 text-admin-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="admin-section-card__action">{action}</div> : null}
      </div>
      <div className="admin-section-card__body">
        {children}
      </div>
    </section>
  );
}
