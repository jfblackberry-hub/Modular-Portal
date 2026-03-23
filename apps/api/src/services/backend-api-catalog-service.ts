import { prisma } from '@payer-portal/database';

type DatabaseApiCatalogCategory =
  | 'CLAIMS'
  | 'PHARMACY'
  | 'ELIGIBILITY'
  | 'CLINICAL'
  | 'AUTHORIZATION';

const CATEGORY_MAP = {
  claims: 'CLAIMS',
  pharmacy: 'PHARMACY',
  eligibility: 'ELIGIBILITY',
  clinical: 'CLINICAL',
  authorization: 'AUTHORIZATION'
} as const satisfies Record<string, DatabaseApiCatalogCategory>;

export type ApiCatalogCategoryFilter = keyof typeof CATEGORY_MAP;

export type ApiCatalogEntrySummary = {
  id: string;
  slug: string;
  name: string;
  category: ApiCatalogCategoryFilter;
  vendor: string;
  description: string;
  endpoint: string;
  version: string;
  inputModels: string[];
  outputModels: string[];
  tenantAvailability: string[];
};

function toCategoryFilter(category: DatabaseApiCatalogCategory): ApiCatalogCategoryFilter {
  switch (category) {
    case 'CLAIMS':
      return 'claims';
    case 'PHARMACY':
      return 'pharmacy';
    case 'ELIGIBILITY':
      return 'eligibility';
    case 'CLINICAL':
      return 'clinical';
    case 'AUTHORIZATION':
      return 'authorization';
    default:
      throw new Error(`Unsupported API catalog category: ${category}`);
  }
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean);
}

function normalizeTenantAvailability(value: unknown) {
  return normalizeStringArray(value);
}

function isEntryAvailableToTenant(tenantAvailability: string[], tenantId: string) {
  return tenantAvailability.includes('*') || tenantAvailability.includes(tenantId);
}

export function parseApiCatalogCategory(value: unknown): ApiCatalogCategoryFilter | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized in CATEGORY_MAP
    ? (normalized as ApiCatalogCategoryFilter)
    : null;
}

export async function listBackendApiCatalogEntries(input: {
  category?: ApiCatalogCategoryFilter | null;
  currentUser: {
    sessionType: 'tenant_admin' | 'end_user' | 'platform_admin';
    roles: string[];
    tenantId: string;
  };
}) {
  const rows = await prisma.apiCatalogEntry.findMany({
    where: input.category
      ? {
          category: CATEGORY_MAP[input.category]
        }
      : undefined,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
  });

  return rows
    .map((row): ApiCatalogEntrySummary => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: toCategoryFilter(row.category),
      vendor: row.vendor,
      description: row.description,
      endpoint: row.endpoint,
      version: row.version,
      inputModels: normalizeStringArray(row.inputModels),
      outputModels: normalizeStringArray(row.outputModels),
      tenantAvailability: normalizeTenantAvailability(row.tenantAvailability)
    }))
    .filter((row) =>
      isPlatformAdminSession(input.currentUser)
        ? true
        : isEntryAvailableToTenant(row.tenantAvailability, input.currentUser.tenantId)
    );
}

function isPlatformAdminSession(user: {
  sessionType: 'tenant_admin' | 'end_user' | 'platform_admin';
  roles: string[];
}) {
  return (
    user.sessionType === 'platform_admin' &&
    (user.roles.includes('platform_admin') || user.roles.includes('platform-admin'))
  );
}
