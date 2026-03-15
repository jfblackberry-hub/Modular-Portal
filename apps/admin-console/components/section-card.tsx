import type { ReactNode } from 'react';

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  children
}: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-admin-border bg-admin-panel p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-admin-text">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-admin-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
