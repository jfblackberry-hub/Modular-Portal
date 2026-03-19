'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface ProviderDashboardActionItem {
  label: string;
  href: string;
}

export function ProviderDashboardActions({
  actions
}: {
  actions: ProviderDashboardActionItem[];
}) {
  const pathname = usePathname();

  return (
    <>
      {actions.map((action) => {
        const isActive = pathname === action.href || pathname.startsWith(`${action.href}/`);

        return (
          <Link
            key={action.label}
            href={action.href}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-[var(--tenant-primary-color)] text-white hover:brightness-110'
                : 'border border-[var(--tenant-primary-color)] bg-white text-[var(--tenant-primary-color)] hover:bg-sky-50'
            }`}
          >
            {action.label}
          </Link>
        );
      })}
    </>
  );
}
