import Link from 'next/link';

import type {
  ProviderPortalConfig,
  ProviderPortalVariant
} from '../../../config/providerPortalConfig';
import { SurfaceCard } from '../../portal-ui';
import { PortalHeroBanner } from '../../shared/portal-hero-banner';

export function ProviderSupportCenterPage({
  config,
  imageSrc,
  variant
}: {
  config: ProviderPortalConfig;
  imageSrc: string;
  variant: ProviderPortalVariant;
}) {
  const support = config.supportModule;

  return (
    <div className="space-y-6">
      <PortalHeroBanner
        eyebrow={config.displayName}
        title={variant === 'medical' ? 'Provider Support and Training Center' : support.title}
        description={support.description}
        imageSrc={imageSrc}
        imageDecorative
        priority
      />

      <SurfaceCard title="Support Categories" description="Find the right support path by topic.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {support.categories.map((category) => (
            <article key={category} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{category}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Support Services" description="Open support paths and self-service options.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {support.cards.map((card) => (
            <article key={card.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{card.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{card.description}</p>
              <Link
                href={card.href}
                className="mt-3 inline-flex text-sm font-semibold text-[var(--tenant-primary-color)] hover:underline"
              >
                Open
              </Link>
            </article>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Training Blocks" description="Role-based training for common provider office tasks.">
        <div className="grid gap-3 md:grid-cols-2">
          {support.trainingBlocks.map((block) => (
            <article key={block.id} className="rounded-xl border border-[var(--border-subtle)] bg-white p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{block.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{block.description}</p>
              <Link
                href={block.href}
                className="mt-3 inline-flex text-sm font-semibold text-[var(--tenant-primary-color)] hover:underline"
              >
                View Training
              </Link>
            </article>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Contextual Quick Links" description="Fast access to core contact channels and help tools.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {support.quickLinks.map((item) => (
            <article key={item.id} className="rounded-xl border border-[var(--border-subtle)] bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{item.value}</p>
              <a
                href={item.href}
                className="mt-2 inline-flex text-sm font-semibold text-[var(--tenant-primary-color)] hover:underline"
              >
                Open
              </a>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
