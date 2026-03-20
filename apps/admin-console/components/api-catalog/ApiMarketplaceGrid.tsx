import { AdminEmptyState } from '../admin-ui';
import type { ApiMarketplaceEntry } from '../../lib/api-marketplace.types';
import { ApiMarketplaceCard } from './ApiMarketplaceCard';

type ApiMarketplaceGridProps = {
  entries: ApiMarketplaceEntry[];
};

export function ApiMarketplaceGrid({ entries }: ApiMarketplaceGridProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10">
        <AdminEmptyState
          title="No APIs match the current browse settings"
          description="Try a broader search, switch categories, or relax one of the marketplace filters."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {entries.map((entry) => (
        <ApiMarketplaceCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
