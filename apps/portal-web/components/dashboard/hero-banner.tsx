'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@payer-portal/ui';
import { ImageBlock } from '../ui/image-block';

function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export function HeroBanner({
  memberName,
  planName,
  coverageStatus,
  heroImageUrl
}: {
  coverageStatus: string;
  heroImageUrl?: string;
  memberName: string;
  planName: string;
}) {
  const router = useRouter();
  const greeting = getGreeting();
  const planSummary = `${planName} - ${coverageStatus}`;
  const heroArtworkSrc =
    heroImageUrl && heroImageUrl.startsWith('/')
      ? heroImageUrl
      : '/assets/portal-images/doctor-consultation.svg';

  return (
    <header
      aria-label="Dashboard welcome banner"
      className="relative overflow-hidden rounded-2xl bg-white shadow-sm"
      style={{
        backgroundImage: heroImageUrl
          ? `linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.78)), url("${heroImageUrl}")`
          : undefined,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary-soft-color)]/40 via-transparent to-white" />

      <div className="relative z-10 flex flex-col gap-8 p-5 md:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--tenant-primary-color)]">Member dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--text-primary)] md:text-4xl">
            {greeting} {memberName}
          </h1>
          <p className="mt-3 text-base font-medium text-[var(--text-secondary)]">{planSummary}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="medium"
              variant="primary"
              className="active:scale-[0.98]"
              onClick={() => router.push('/dashboard/id-card')}
            >
              View ID Card
            </Button>
            <Button
              size="medium"
              variant="secondary"
              className="active:scale-[0.98]"
              onClick={() => router.push('/dashboard/providers')}
            >
              Find Care
            </Button>
            <Button
              size="medium"
              variant="outline"
              className="active:scale-[0.98]"
              onClick={() => router.push('/dashboard/claims')}
            >
              Check Claims
            </Button>
          </div>
        </div>

        <div className="w-full lg:max-w-[360px]">
          <ImageBlock
            src={heroArtworkSrc}
            alt="Doctor consulting with a member"
            className="aspect-[4/3] shadow-sm"
            gradientOverlay
            priority
          />
        </div>
      </div>
    </header>
  );
}
