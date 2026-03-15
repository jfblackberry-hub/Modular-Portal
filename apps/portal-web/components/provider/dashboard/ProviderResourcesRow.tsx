import Link from 'next/link';

export interface ProviderResourceTile {
  label: string;
  href: string;
  description: string;
}

export function ProviderResourcesRow({ resources }: { resources: ProviderResourceTile[] }) {
  return (
    <section className="portal-card p-4">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">Resources</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {resources.map((resource) => (
          <Link
            key={resource.label}
            href={resource.href}
            className="rounded-lg border border-[var(--border-subtle)] bg-slate-50 px-3 py-2 transition hover:border-[var(--tenant-primary-color)]"
          >
            <p className="text-sm font-semibold text-[var(--text-primary)]">{resource.label}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{resource.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
