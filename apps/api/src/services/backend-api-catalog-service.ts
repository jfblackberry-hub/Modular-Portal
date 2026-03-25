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

const CATEGORY_VALUES = Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>;

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

export type BackendApiCatalogEntry = ApiCatalogEntrySummary;

export type UpsertApiCatalogEntryInput = {
  slug?: string;
  name: string;
  category: ApiCatalogCategoryFilter;
  vendor: string;
  description: string;
  endpoint: string;
  version: string;
  inputModels?: string[];
  outputModels?: string[];
  tenantAvailability?: string[];
  sortOrder?: number;
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeInputArray(value: string[] | undefined) {
  return (value ?? []).map((entry) => entry.trim()).filter(Boolean);
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

function requireCategory(value: string) {
  const category = parseApiCatalogCategory(value);
  if (!category) {
    throw new Error(
      `Invalid category. Supported values: ${CATEGORY_VALUES.join(', ')}.`
    );
  }
  return category;
}

function validateUpsertInput(input: UpsertApiCatalogEntryInput) {
  const name = input.name.trim();
  const vendor = input.vendor.trim();
  const description = input.description.trim();
  const endpoint = input.endpoint.trim();
  const version = input.version.trim();

  if (!name) {
    throw new Error('Name is required.');
  }

  if (!vendor) {
    throw new Error('Vendor is required.');
  }

  if (!description) {
    throw new Error('Description is required.');
  }

  if (!endpoint) {
    throw new Error('Endpoint is required.');
  }

  if (!version) {
    throw new Error('Version is required.');
  }

  const category = requireCategory(input.category);
  const slugSource = input.slug?.trim() || `${vendor}-${name}`;
  const slug = slugify(slugSource);

  if (!slug) {
    throw new Error('Slug is required.');
  }

  return {
    slug,
    name,
    category,
    vendor,
    description,
    endpoint,
    version,
    inputModels: normalizeInputArray(input.inputModels),
    outputModels: normalizeInputArray(input.outputModels),
    tenantAvailability: normalizeInputArray(input.tenantAvailability),
    sortOrder:
      typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)
        ? input.sortOrder
        : 0
  };
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

export async function createBackendApiCatalogEntry(input: UpsertApiCatalogEntryInput) {
  const normalized = validateUpsertInput(input);

  return prisma.apiCatalogEntry.create({
    data: {
      slug: normalized.slug,
      name: normalized.name,
      category: CATEGORY_MAP[normalized.category],
      vendor: normalized.vendor,
      description: normalized.description,
      endpoint: normalized.endpoint,
      version: normalized.version,
      inputModels: normalized.inputModels,
      outputModels: normalized.outputModels,
      tenantAvailability: normalized.tenantAvailability,
      sortOrder: normalized.sortOrder
    }
  });
}

export async function getBackendApiCatalogEntryById(id: string): Promise<BackendApiCatalogEntry> {
  const row = await prisma.apiCatalogEntry.findUnique({
    where: { id }
  });

  if (!row) {
    throw new Error('Catalog entry not found');
  }

  return {
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
  };
}

export async function updateBackendApiCatalogEntry(
  id: string,
  input: UpsertApiCatalogEntryInput
) {
  const normalized = validateUpsertInput(input);

  return prisma.apiCatalogEntry.update({
    where: { id },
    data: {
      slug: normalized.slug,
      name: normalized.name,
      category: CATEGORY_MAP[normalized.category],
      vendor: normalized.vendor,
      description: normalized.description,
      endpoint: normalized.endpoint,
      version: normalized.version,
      inputModels: normalized.inputModels,
      outputModels: normalized.outputModels,
      tenantAvailability: normalized.tenantAvailability,
      sortOrder: normalized.sortOrder
    }
  });
}

export async function deleteBackendApiCatalogEntry(id: string) {
  await prisma.apiCatalogEntry.delete({
    where: { id }
  });
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
