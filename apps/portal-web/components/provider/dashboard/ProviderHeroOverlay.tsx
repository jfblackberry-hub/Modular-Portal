'use client';

import { useEffect, useState } from 'react';

import { getTimeOfDayGreeting } from '../../../lib/get-time-of-day-greeting';

export function ProviderHeroOverlay({
  clinicName,
  providerName,
  label,
  subtitle
}: {
  clinicName: string;
  providerName: string;
  label?: string;
  subtitle?: string;
}) {
  const [greeting, setGreeting] = useState(() => getTimeOfDayGreeting(new Date()));

  useEffect(() => {
    const updateGreeting = () => setGreeting(getTimeOfDayGreeting(new Date()));

    updateGreeting();
    const timer = window.setInterval(updateGreeting, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="max-w-[620px]">
      {label ? (
        <p className="text-[14px] font-semibold tracking-tight text-[var(--tenant-primary-color)] sm:text-[15px]">
          {label}
        </p>
      ) : null}

      <p className="mt-5 text-[34px] font-semibold leading-[1.08] text-[var(--primary-900)] sm:mt-6 sm:text-[48px] lg:text-[60px]">
        {greeting}, {providerName}
      </p>

      <p className="mt-4 text-[24px] font-medium leading-tight text-[var(--text-primary)] sm:text-[30px]">
        {clinicName}
      </p>

      {subtitle ? (
        <p className="mt-3 max-w-[480px] text-sm leading-6 text-[var(--text-secondary)] sm:text-[15px]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
