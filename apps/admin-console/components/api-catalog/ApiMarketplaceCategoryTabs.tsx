import { API_MARKETPLACE_CATEGORY_TABS } from '../../lib/api-marketplace.data';
import type { MarketplaceCategory } from '../../lib/api-marketplace.types';

type ApiMarketplaceCategoryTabsProps = {
  selectedCategory: 'All APIs' | MarketplaceCategory;
  counts: Record<string, number>;
  onSelect: (category: 'All APIs' | MarketplaceCategory) => void;
};

export function ApiMarketplaceCategoryTabs({
  selectedCategory,
  counts,
  onSelect
}: ApiMarketplaceCategoryTabsProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Browse by category</p>
        <p className="mt-1 text-sm text-slate-600">
          Jump into the healthcare API domains most relevant to your tenant onboarding and integration planning.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {API_MARKETPLACE_CATEGORY_TABS.map((category) => {
          const selected = selectedCategory === category;
          const count =
            category === 'All APIs'
              ? Object.values(counts).reduce((sum, value) => sum + value, 0)
              : counts[category] ?? 0;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              className={`shrink-0 rounded-full border px-4 py-3 text-left transition ${
                selected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_26px_rgba(15,23,42,0.16)]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{category}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selected ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
