import type { ApiCatalogEntry } from '../../lib/api-catalog.types';
import { ApiCatalogCard } from './ApiCatalogCard';

type ApiCatalogListProps = {
  entries: ApiCatalogEntry[];
  onSelect: (entry: ApiCatalogEntry) => void;
};

export function ApiCatalogList({ entries, onSelect }: ApiCatalogListProps) {
  const featuredEntries = entries.filter(
    (entry) => entry.strategicPriority === 'Critical' || entry.awsRelevance === 'Blocker'
  ).slice(0, 2);
  const featuredIds = new Set(featuredEntries.map((entry) => entry.id));
  const standardEntries = entries.filter((entry) => !featuredIds.has(entry.id));

  return (
    <div className="space-y-6">
      {featuredEntries.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              Featured for planning
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Highest-priority APIs for platform strategy and AWS planning.
            </p>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {featuredEntries.map((entry) => (
              <ApiCatalogCard key={entry.id} entry={entry} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {standardEntries.map((entry) => (
          <ApiCatalogCard key={entry.id} entry={entry} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
