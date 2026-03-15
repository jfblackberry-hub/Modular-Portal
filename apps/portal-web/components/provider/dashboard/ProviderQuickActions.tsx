import Link from 'next/link';

export interface ProviderQuickActionItem {
  label: string;
  href: string;
}

export function ProviderQuickActions({ actions }: { actions: ProviderQuickActionItem[] }) {
  return (
    <section className="portal-card p-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              index < 2
                ? 'bg-[var(--tenant-primary-color)] text-white hover:brightness-110'
                : 'border border-[var(--tenant-primary-color)] bg-white text-[var(--tenant-primary-color)] hover:bg-sky-50'
            }`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
