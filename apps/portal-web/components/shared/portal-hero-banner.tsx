import type { ReactNode } from 'react';

import { ImageBlock } from '../ui/image-block';

export function PortalHeroBanner({
  actions,
  contentFooter,
  description,
  eyebrow,
  imageAlt,
  imageClassName,
  imageDecorative = true,
  imageSrc,
  layout = 'split',
  cornerOverlayContent,
  overlayContent,
  priority = false,
  title
}: {
  actions?: ReactNode;
  contentFooter?: ReactNode;
  description: string;
  eyebrow?: string;
  imageAlt?: string;
  imageClassName?: string;
  imageDecorative?: boolean;
  imageSrc: string;
  layout?: 'split' | 'stacked' | 'overlay';
  cornerOverlayContent?: ReactNode;
  overlayContent?: ReactNode;
  priority?: boolean;
  title: string;
}) {
  if (layout === 'overlay') {
    return (
      <section className="portal-card relative overflow-hidden p-0">
        <div className="relative min-h-[240px] sm:min-h-[290px] lg:min-h-[320px]">
          <div className="absolute inset-0">
            <ImageBlock
              src={imageSrc}
              alt={imageDecorative ? '' : imageAlt ?? ''}
              className={imageClassName ?? 'h-full min-h-[240px] sm:min-h-[290px] lg:min-h-[320px]'}
              gradientOverlay={false}
              imageClassName={layout === 'overlay' ? 'object-[78%_center]' : undefined}
              rounded={false}
              priority={priority}
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/8 sm:via-white/78 sm:to-transparent"
            aria-hidden="true"
          />
          <div className="relative z-10 flex min-h-[240px] items-center px-5 py-6 sm:min-h-[290px] sm:px-8 sm:py-8 lg:min-h-[320px]">
            {overlayContent}
          </div>
          {cornerOverlayContent ? (
            <div className="absolute bottom-4 right-4 z-10 sm:bottom-6 sm:right-6">{cornerOverlayContent}</div>
          ) : null}
        </div>

        <div className="relative border-t border-[var(--border-subtle)]/70 px-5 py-5 sm:px-8 sm:py-6">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">{eyebrow}</p>
            ) : null}
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>
          </div>
          {contentFooter ? <div className="mt-5 w-full">{contentFooter}</div> : null}
          {actions ? <div className="mt-5 flex w-full flex-wrap gap-3">{actions}</div> : null}
        </div>
      </section>
    );
  }

  if (layout === 'stacked') {
    return (
      <section className="portal-card relative overflow-hidden p-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white/80" aria-hidden="true" />
        <div className="relative px-5 py-5 sm:px-8 sm:py-7">
          <div className="mx-auto w-full max-w-[880px]">
            <ImageBlock
              src={imageSrc}
              alt={imageDecorative ? '' : imageAlt ?? ''}
              className={imageClassName ?? 'aspect-[16/7]'}
              gradientOverlay={false}
              priority={priority}
            />
          </div>

          <div className="mx-auto mt-6 w-full max-w-[860px] text-center">
            {eyebrow ? (
              <p className="text-[13px] font-medium text-[var(--tenant-primary-color)]">{eyebrow}</p>
            ) : null}
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[32px]">
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">{description}</p>
            {contentFooter ? <div className="mt-5 text-left">{contentFooter}</div> : null}
            {actions ? <div className="mt-5 flex flex-wrap justify-center gap-3">{actions}</div> : null}
          </div>
        </div>
      </section>
    );
  }

  const hasImage = Boolean(imageSrc?.trim());

  return (
    <section className="portal-card relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30" aria-hidden="true" />
      <div
        className={`relative grid gap-6 px-6 py-6 sm:px-8 sm:py-7 ${
          hasImage ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-center' : ''
        }`}
      >
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

        {hasImage ? (
          <div className="w-full max-w-[420px] justify-self-end">
            <ImageBlock
              src={imageSrc}
              alt={imageDecorative ? '' : imageAlt ?? ''}
              className={imageClassName ?? 'aspect-[4/3]'}
              gradientOverlay={false}
              priority={priority}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
