import { API_CATEGORIES } from '../../lib/api-catalog.constants';
import type { ApiCategory } from '../../lib/api-catalog.types';

type ApiCatalogCategoryNavProps = {
  selectedCategory: ApiCategory | 'All';
  counts: Record<string, number>;
  onSelect: (category: ApiCategory | 'All') => void;
};

export function ApiCatalogCategoryNav({
  selectedCategory,
  counts,
  onSelect
}: ApiCatalogCategoryNavProps) {
  const featuredCategories: Array<ApiCategory> = [
    'Claims',
    'Clinical',
    'Pharmacy',
    'Eligibility',
    'Payments',
    'Interoperability',
    'Care Management',
    'Admin'
  ];

  const categories = ['All', ...featuredCategories] as Array<ApiCategory | 'All'>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Browse by category
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Start with the major integration domains most users care about.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {API_CATEGORIES.length} total catalog categories
        </p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {categories.map((category) => {
          const selected = selectedCategory === category;
          const count =
            category === 'All'
              ? Object.values(counts).reduce((sum, value) => sum + value, 0)
              : counts[category] ?? 0;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              className={`min-w-[9.75rem] rounded-full border px-4 py-2.5 text-left transition ${
                selected
                  ? 'border-cyan-300 bg-cyan-50 shadow-[0_8px_22px_rgba(8,145,178,0.10)]'
                  : 'border-slate-200 bg-white/88 shadow-[0_6px_18px_rgba(15,23,42,0.03)]'
              }`}
            >
              <p className="text-sm font-semibold text-slate-950">{category}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {count} API{count === 1 ? '' : 's'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
