import type { ApiCatalogEntry } from '../../lib/api-catalog-api';
import { ApiMarketplaceCard } from './ApiMarketplaceCard';

type ApiMarketplaceFeaturedSectionProps = {
  entries: ApiCatalogEntry[];
};

export function ApiMarketplaceFeaturedSection({
  entries
}: ApiMarketplaceFeaturedSectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Featured APIs</p>
          <p className="mt-1 text-sm text-slate-600">
            Strategic integrations that are ready for tenant planning, marketplace rollout, or AWS sequencing.
          </p>
        </div>
        <a
          href="/admin/developer/adapters"
          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Manage applied APIs
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {entries.slice(0, 2).map((entry) => (
          <ApiMarketplaceCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
