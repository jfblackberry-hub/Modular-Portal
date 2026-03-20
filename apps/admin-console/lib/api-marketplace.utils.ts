import type {
  ApiMarketplaceEntry,
  ApiMarketplaceFilters,
  MarketplaceCategory,
  MarketplaceSort
} from './api-marketplace.types';

function compareStrings(left: string, right: string) {
  return left.localeCompare(right);
}

function categorySortRank(category: MarketplaceCategory) {
  const order: MarketplaceCategory[] = [
    'Claims',
    'Eligibility & Benefits',
    'Provider',
    'Member',
    'Enrollment & Billing',
    'Pharmacy',
    'Clinical',
    'Prior Authorization',
    'Interoperability / FHIR',
    'Financial / Payments',
    'Admin / Platform'
  ];

  return order.indexOf(category);
}

function compareBySort(left: ApiMarketplaceEntry, right: ApiMarketplaceEntry, sort: MarketplaceSort) {
  if (sort === 'Alphabetical') {
    return compareStrings(left.name, right.name);
  }

  if (sort === 'Recently Updated') {
    return new Date(right.lastUpdated).getTime() - new Date(left.lastUpdated).getTime();
  }

  if (sort === 'Most Popular') {
    return right.popularityScore - left.popularityScore;
  }

  if (sort === 'Recommended') {
    return right.recommendedScore - left.recommendedScore;
  }

  return (
    right.recommendedScore - left.recommendedScore ||
    categorySortRank(left.category) - categorySortRank(right.category) ||
    compareStrings(left.publisher, right.publisher)
  );
}

export function filterMarketplaceEntries(
  entries: ApiMarketplaceEntry[],
  filters: ApiMarketplaceFilters
) {
  const search = filters.search.trim().toLowerCase();

  return entries
    .filter((entry) => {
      const matchesSearch =
        !search ||
        [
          entry.name,
          entry.publisher,
          entry.platformName,
          entry.shortDescription,
          entry.fullDescription,
          entry.category,
          entry.subcategory,
          entry.apiType,
          entry.authType,
          ...entry.domainTags,
          ...entry.audience,
          ...entry.standards,
          ...entry.supportedModules
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        filters.category === 'All APIs' || entry.category === filters.category;
      const matchesApiType = filters.apiType === 'All' || entry.apiType === filters.apiType;
      const matchesAudience =
        filters.audience === 'All' || entry.audience.includes(filters.audience);
      const matchesStatus =
        filters.lifecycleStatus === 'All' || entry.lifecycleStatus === filters.lifecycleStatus;
      const matchesAuth =
        filters.authType === 'All' || entry.authType === filters.authType;
      const matchesSandbox =
        filters.sandbox === 'All' ||
        (filters.sandbox === 'Yes' ? entry.sandboxAvailable : !entry.sandboxAvailable);
      const matchesPublisher =
        filters.publisher === 'All' || entry.publisher === filters.publisher;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesApiType &&
        matchesAudience &&
        matchesStatus &&
        matchesAuth &&
        matchesSandbox &&
        matchesPublisher
      );
    })
    .sort((left, right) => compareBySort(left, right, filters.sort));
}

export function getMarketplacePublishers(entries: ApiMarketplaceEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.publisher))).sort();
}

export function getMarketplaceAuthTypes(entries: ApiMarketplaceEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.authType))).sort();
}

export function getMarketplaceCounts(entries: ApiMarketplaceEntry[]) {
  return entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.category] = (counts[entry.category] ?? 0) + 1;
    return counts;
  }, {});
}

export function getFeaturedMarketplaceEntries(entries: ApiMarketplaceEntry[]) {
  return [...entries]
    .filter((entry) => entry.featured)
    .sort((left, right) => right.recommendedScore - left.recommendedScore)
    .slice(0, 6);
}

export function getPopularMarketplaceCategories(entries: ApiMarketplaceEntry[]) {
  return Object.entries(getMarketplaceCounts(entries))
    .sort((left, right) => right[1] - left[1] || compareStrings(left[0], right[0]))
    .slice(0, 6);
}

export function getRelatedMarketplaceEntries(
  entries: ApiMarketplaceEntry[],
  selected: ApiMarketplaceEntry
) {
  const relatedBySlug = new Set(selected.relatedApiSlugs);

  return entries
    .filter((entry) => relatedBySlug.has(entry.slug))
    .sort((left, right) => right.recommendedScore - left.recommendedScore);
}
