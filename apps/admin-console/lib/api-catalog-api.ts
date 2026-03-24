export type ApiCatalogCategory =
  | 'claims'
  | 'pharmacy'
  | 'eligibility'
  | 'clinical'
  | 'authorization';

export type ApiCatalogEntry = {
  id: string;
  slug: string;
  name: string;
  category: ApiCatalogCategory;
  vendor: string;
  description: string;
  endpoint: string;
  version: string;
  inputModels: string[];
  outputModels: string[];
  tenantAvailability: string[];
};

export type ApiCatalogSort =
  | 'featured'
  | 'name-asc'
  | 'name-desc'
  | 'vendor-asc'
  | 'version-desc';

export const API_CATALOG_CATEGORIES: ApiCatalogCategory[] = [
  'claims',
  'pharmacy',
  'clinical',
  'eligibility',
  'authorization'
];

export function formatApiCatalogCategory(category: ApiCatalogCategory) {
  switch (category) {
    case 'claims':
      return 'Claims';
    case 'pharmacy':
      return 'Pharmacy';
    case 'clinical':
      return 'Clinical';
    case 'eligibility':
      return 'Eligibility';
    case 'authorization':
      return 'Authorization';
  }
}

export function formatTenantAvailability(tenantAvailability: string[]) {
  if (tenantAvailability.includes('*')) {
    return 'All tenants';
  }

  if (tenantAvailability.length === 0) {
    return 'No tenants assigned';
  }

  if (tenantAvailability.length === 1) {
    return '1 tenant';
  }

  return `${tenantAvailability.length} tenants`;
}

export function sortApiCatalogEntries(
  entries: ApiCatalogEntry[],
  sort: ApiCatalogSort
) {
  const sortedEntries = [...entries];

  sortedEntries.sort((left, right) => {
    switch (sort) {
      case 'name-desc':
        return right.name.localeCompare(left.name);
      case 'vendor-asc':
        return left.vendor.localeCompare(right.vendor) || left.name.localeCompare(right.name);
      case 'version-desc':
        return right.version.localeCompare(left.version) || left.name.localeCompare(right.name);
      case 'featured':
        return (
          right.inputModels.length +
            right.outputModels.length -
            (left.inputModels.length + left.outputModels.length) ||
          left.name.localeCompare(right.name)
        );
      case 'name-asc':
      default:
        return left.name.localeCompare(right.name);
    }
  });

  return sortedEntries;
}

export function groupApiCatalogEntries(entries: ApiCatalogEntry[]) {
  return API_CATALOG_CATEGORIES.map((category) => ({
    category,
    label: formatApiCatalogCategory(category),
    entries: entries.filter((entry) => entry.category === category)
  })).filter((group) => group.entries.length > 0);
}

export function getApiCatalogVendors(entries: ApiCatalogEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.vendor).filter(Boolean))).sort();
}
