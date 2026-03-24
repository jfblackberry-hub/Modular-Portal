import type { ApiCatalogCategory, ApiCatalogEntry } from '../../lib/api-catalog-api';
import { AdminEmptyState } from '../admin-ui';
import { ApiMarketplaceCard } from './ApiMarketplaceCard';

type ApiMarketplaceGridProps = {
  groups: Array<{
    category: ApiCatalogCategory;
    label: string;
    entries: ApiCatalogEntry[];
  }>;
};

export function ApiMarketplaceGrid({ groups }: ApiMarketplaceGridProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10">
        <AdminEmptyState
          title="No APIs match the current browse settings"
          description="Try a broader search, another vendor, or a different category."
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {groups.map((group) => (
        <section key={group.category} className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
                {group.label}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {group.entries.length} API{group.entries.length === 1 ? '' : 's'} available in this category
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {group.entries.map((entry) => (
              <ApiMarketplaceCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
