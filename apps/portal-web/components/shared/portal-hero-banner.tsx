import type { ReactNode } from 'react';

import { ImageBlock } from '../ui/image-block';

export function PortalHeroBanner({
  actions,
  description,
  eyebrow,
  imageAlt,
  imageDecorative = true,
  imageSrc,
  priority = false,
  title
}: {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  imageAlt?: string;
  imageDecorative?: boolean;
  imageSrc: string;
  priority?: boolean;
  title: string;
}) {
  return (
    <section className="portal-card relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30" aria-hidden="true" />
      <div className="relative grid gap-6 px-6 py-6 sm:px-8 sm:py-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-center">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>
          {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        <div className="w-full max-w-[420px] justify-self-end">
          <ImageBlock
            src={imageSrc}
            alt={imageDecorative ? '' : imageAlt ?? ''}
            className="aspect-[4/3]"
            gradientOverlay={false}
            priority={priority}
          />
        </div>
      </div>
    </section>
  );
}
