import {
  AWS_RELEVANCE_OPTIONS,
  IMPLEMENTATION_STATUSES,
  STRATEGIC_PRIORITIES
} from './api-catalog.constants';
import type {
  ApiCatalogEntry,
  ApiCatalogFiltersState,
  ApiCatalogSortField,
  AuthType
} from './api-catalog.types';

const statusRank = new Map(IMPLEMENTATION_STATUSES.map((value, index) => [value, index]));
const priorityRank = new Map(STRATEGIC_PRIORITIES.map((value, index) => [value, index]));
const awsRank = new Map(AWS_RELEVANCE_OPTIONS.map((value, index) => [value, index]));

function compareString(left: string, right: string, direction: 'asc' | 'desc') {
  return direction === 'asc'
    ? left.localeCompare(right)
    : right.localeCompare(left);
}

function compareRank(
  left: number,
  right: number,
  direction: 'asc' | 'desc'
) {
  return direction === 'asc' ? left - right : right - left;
}

function compareByField(
  left: ApiCatalogEntry,
  right: ApiCatalogEntry,
  sortBy: ApiCatalogSortField,
  direction: 'asc' | 'desc'
) {
  if (sortBy === 'vendorName') {
    return compareString(left.vendorName, right.vendorName, direction);
  }

  if (sortBy === 'apiCategory') {
    return compareString(left.apiCategory, right.apiCategory, direction);
  }

  if (sortBy === 'implementationStatus') {
    return compareRank(
      statusRank.get(left.implementationStatus) ?? 99,
      statusRank.get(right.implementationStatus) ?? 99,
      direction
    );
  }

  if (sortBy === 'strategicPriority') {
    return compareRank(
      priorityRank.get(left.strategicPriority) ?? 99,
      priorityRank.get(right.strategicPriority) ?? 99,
      direction
    );
  }

  if (sortBy === 'awsRelevance') {
    return compareRank(
      awsRank.get(left.awsRelevance) ?? 99,
      awsRank.get(right.awsRelevance) ?? 99,
      direction
    );
  }

  return direction === 'asc'
    ? new Date(left.lastReviewed).getTime() - new Date(right.lastReviewed).getTime()
    : new Date(right.lastReviewed).getTime() - new Date(left.lastReviewed).getTime();
}

export function filterAndSortApiCatalogEntries(
  entries: ApiCatalogEntry[],
  filters: ApiCatalogFiltersState
) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return entries
    .filter((entry) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          entry.vendorName,
          entry.platformName,
          entry.apiName,
          entry.apiCategory,
          entry.apiSubcategory,
          entry.summary,
          entry.description,
          ...entry.tags,
          ...entry.supportedModules,
          ...entry.authTypes
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(entry.apiCategory);

      const matchesImplementationStatus =
        filters.implementationStatuses.length === 0 ||
        filters.implementationStatuses.includes(entry.implementationStatus);

      const matchesPriority =
        filters.strategicPriorities.length === 0 ||
        filters.strategicPriorities.includes(entry.strategicPriority);

      const matchesVendor =
        filters.vendor === 'All' || entry.vendorName === filters.vendor;

      const matchesAuthType =
        filters.authType === 'All' ||
        entry.authTypes.includes(filters.authType as AuthType);

      const matchesTenantConfigurable =
        filters.tenantConfigurable === 'All' ||
        (filters.tenantConfigurable === 'Yes'
          ? entry.tenantConfigurable
          : !entry.tenantConfigurable);

      const matchesAwsRelevance =
        filters.awsRelevance === 'All' || entry.awsRelevance === filters.awsRelevance;

      const matchesTag =
        filters.selectedTag === 'All' || entry.tags.includes(filters.selectedTag);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesImplementationStatus &&
        matchesPriority &&
        matchesVendor &&
        matchesAuthType &&
        matchesTenantConfigurable &&
        matchesAwsRelevance &&
        matchesTag
      );
    })
    .sort((left, right) => {
      const result = compareByField(left, right, filters.sortBy, filters.sortDirection);
      if (result !== 0) {
        return result;
      }

      return left.apiName.localeCompare(right.apiName);
    });
}

export function getApiCatalogQuickTags(entries: ApiCatalogEntry[]) {
  const tagCounts = new Map<string, number>();

  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 12)
    .map(([tag]) => tag);
}

export function getUniqueVendors(entries: ApiCatalogEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.vendorName))).sort();
}

export function getCategoryTone(category: ApiCatalogEntry['apiCategory']) {
  const tones: Record<ApiCatalogEntry['apiCategory'], string> = {
    Pharmacy: 'bg-fuchsia-100 text-fuchsia-700',
    Claims: 'bg-sky-100 text-sky-700',
    Clinical: 'bg-emerald-100 text-emerald-700',
    Eligibility: 'bg-cyan-100 text-cyan-700',
    Benefits: 'bg-indigo-100 text-indigo-700',
    Authorizations: 'bg-amber-100 text-amber-700',
    'Prior Authorization': 'bg-orange-100 text-orange-700',
    Payments: 'bg-teal-100 text-teal-700',
    Enrollment: 'bg-violet-100 text-violet-700',
    Billing: 'bg-blue-100 text-blue-700',
    Provider: 'bg-green-100 text-green-700',
    Member: 'bg-rose-100 text-rose-700',
    Employer: 'bg-lime-100 text-lime-700',
    Broker: 'bg-yellow-100 text-yellow-700',
    Admin: 'bg-slate-200 text-slate-700',
    Identity: 'bg-zinc-200 text-zinc-700',
    Observability: 'bg-red-100 text-red-700',
    Documents: 'bg-stone-100 text-stone-700',
    Interoperability: 'bg-purple-100 text-purple-700',
    Analytics: 'bg-pink-100 text-pink-700',
    'Care Management': 'bg-emerald-100 text-emerald-700',
    'CRM / Engagement': 'bg-orange-100 text-orange-700'
  };

  return tones[category];
}

export function getPriorityTone(priority: ApiCatalogEntry['strategicPriority']) {
  if (priority === 'Critical') {
    return 'bg-rose-100 text-rose-700';
  }

  if (priority === 'High') {
    return 'bg-amber-100 text-amber-700';
  }

  if (priority === 'Medium') {
    return 'bg-sky-100 text-sky-700';
  }

  return 'bg-slate-200 text-slate-700';
}

export function getImplementationTone(status: ApiCatalogEntry['implementationStatus']) {
  if (status === 'Implemented') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Partial') {
    return 'bg-sky-100 text-sky-700';
  }

  if (status === 'Planned') {
    return 'bg-amber-100 text-amber-700';
  }

  if (status === 'Mocked') {
    return 'bg-violet-100 text-violet-700';
  }

  return 'bg-slate-200 text-slate-700';
}

export function getAwsTone(relevance: ApiCatalogEntry['awsRelevance']) {
  if (relevance === 'Blocker') {
    return 'bg-rose-100 text-rose-700';
  }

  if (relevance === 'Important') {
    return 'bg-amber-100 text-amber-700';
  }

  if (relevance === 'Helpful') {
    return 'bg-sky-100 text-sky-700';
  }

  return 'bg-slate-200 text-slate-700';
}
