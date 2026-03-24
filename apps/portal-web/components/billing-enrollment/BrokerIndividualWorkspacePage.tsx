'use client';

import { InlineButton, PageHeader, SurfaceCard } from '../portal-ui';

export function BrokerIndividualWorkspacePage({
  ctaHref,
  ctaLabel,
  description,
  eyebrow = 'Broker E&B Portal',
  highlights,
  title
}: {
  ctaHref: string;
  ctaLabel: string;
  description: string;
  eyebrow?: string;
  highlights: string[];
  title: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={<InlineButton href={ctaHref}>{ctaLabel}</InlineButton>}
      />

      <SurfaceCard
        title={`${title} workspace`}
        description="Focused broker workflow guidance for this dashboard tab."
      >
        <div className="space-y-3">
          {highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-3xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
            >
              {highlight}
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
