import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { MultipartFile } from '@fastify/multipart';
import {
  createOrganizationUnit,
  Prisma,
  prisma,
  syncTenantTypeDefinitions,
  updateOrganizationUnit
} from '@payer-portal/database';
import type { Tenant, TenantType } from '@payer-portal/database';
import {
  buildTenantLogoStorageKey,
  getPublicAssetStorageService,
  logAdminAction,
  publishInBackground
} from '@payer-portal/server';

type TenantInput = {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type: TenantType;
  brandingConfig: Record<string, unknown>;
};

type TenantUpdateInput = {
  status?: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  type?: TenantType;
  quotaUsers?: number;
  quotaMembers?: number;
  quotaStorageGb?: number;
};

type BrandingConfig = Record<string, unknown>;

type TenantLifecycleConfig = {
  archivedAt?: string;
  archivedByUserId?: string | null;
  deletedAt?: string;
  deletedByUserId?: string | null;
};

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

type ImportedOfficeLocation = {
  city: string | null;
  company: string | null;
  activeFlag: boolean | null;
  locationName: string;
  locationId: string | null;
  notes: string | null;
  phone: string | null;
  region: string | null;
  servicesOffered: string[];
  state: string | null;
  streetAddress: string | null;
  zip: string | null;
};

type OfficeLocationMetadata = {
  activeFlag?: boolean | null;
  address?: {
    city?: string | null;
    state?: string | null;
    streetAddress?: string | null;
    zip?: string | null;
  };
  company?: string | null;
  importSource?: string | null;
  locationId?: string | null;
  notes?: string | null;
  phone?: string | null;
  region?: string | null;
  servicesOffered?: string[];
};

type OfficeLocationImportResult = {
  createdCount: number;
  createdLocations: Array<{
    id: string;
    name: string;
    parentId: string | null;
    type: string;
  }>;
  parentOrganizationUnitId: string;
  skippedCount: number;
  updatedCount: number;
};

type OfficeLocationUpdateInput = {
  activeFlag?: boolean | null;
  company?: string | null;
  locationId?: string | null;
  name?: string;
  notes?: string | null;
  phone?: string | null;
  region?: string | null;
  servicesOffered?: string[];
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

const TENANT_TYPES = [
  'PAYER',
  'EMPLOYER',
  'BROKER',
  'MEMBER',
  'PROVIDER'
] as const satisfies readonly TenantType[];

const tenantTypeSet = new Set<string>(TENANT_TYPES);

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapTenant(tenant: Tenant) {
  const brandingConfig = tenant.brandingConfig as BrandingConfig;
  const platformQuota = isRecord(brandingConfig.platformQuota)
    ? brandingConfig.platformQuota
    : {};
  const lifecycleConfig = isRecord(brandingConfig.lifecycle)
    ? (brandingConfig.lifecycle as TenantLifecycleConfig)
    : {};

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    type: tenant.type,
    healthStatus:
      tenant.status === 'ACTIVE'
        ? 'HEALTHY'
        : tenant.status === 'ONBOARDING'
          ? 'PROVISIONING'
          : 'SUSPENDED',
    brandingConfig: tenant.brandingConfig as Prisma.JsonValue,
    quotaMembers:
      typeof platformQuota.members === 'number' ? platformQuota.members : null,
    quotaUsers:
      typeof platformQuota.users === 'number' ? platformQuota.users : null,
    quotaStorageGb:
      typeof platformQuota.storageGb === 'number'
        ? platformQuota.storageGb
        : null,
    isArchived: typeof lifecycleConfig.archivedAt === 'string',
    archivedAt:
      typeof lifecycleConfig.archivedAt === 'string'
        ? lifecycleConfig.archivedAt
        : null,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt
  };
}

function normalizeTenantType(value: TenantType | string) {
  const normalized = value.trim().toUpperCase();

  if (!tenantTypeSet.has(normalized)) {
    throw new Error(`Tenant type must be one of: ${TENANT_TYPES.join(', ')}`);
  }

  return normalized as TenantType;
}

function isTenantSlugConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes('slug')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getExtension(fileName: string, mimeType: string) {
  const parsedExtension = path.extname(fileName).toLowerCase();

  if (parsedExtension) {
    return parsedExtension;
  }

  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/svg+xml':
      return '.svg';
    case 'image/webp':
      return '.webp';
    default:
      return '.bin';
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function normalizeBooleanFlag(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', 'yes', 'y', '1', 'active'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'n', '0', 'inactive'].includes(normalized)) {
    return false;
  }

  return null;
}

function normalizeServicesOffered(value: string | null) {
  if (!value) {
    return [];
  }

  return [...new Set(value
    .split(/[|,/;]/)
    .map((entry) => entry.trim())
    .filter(Boolean))];
}

function toSlugCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 4))
    .join('-');
}

function buildLocationCode(input: {
  company: string | null;
  locationName: string;
  sequence: number;
}) {
  const companyCode = toSlugCode(input.company ?? 'tenant') || 'TENANT';
  const locationCode = toSlugCode(input.locationName) || 'LOC';

  return `${companyCode}-${locationCode}-${String(input.sequence).padStart(2, '0')}`;
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    const nextChar = line[index + 1];

    if (char === '"') {
      if (isQuoted && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      isQuoted = !isQuoted;
      continue;
    }

    if (!isQuoted && char === delimiter) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string) {
  const candidates = [',', '|', '\t', ';'];
  const ranked = candidates
    .map((delimiter) => ({
      delimiter,
      columns: splitDelimitedLine(headerLine, delimiter).length
    }))
    .sort((left, right) => right.columns - left.columns);

  return ranked[0]?.columns && ranked[0].columns > 1 ? ranked[0].delimiter : ',';
}

function readDelimitedRows(content: string) {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      'Location import file must include a header row and at least one data row.'
    );
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = splitDelimitedLine(lines[0]!, delimiter).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => splitDelimitedLine(line, delimiter));

  return {
    headers,
    rows
  };
}

function getCellValue(headers: string[], values: string[], aliases: string[]) {
  const headerIndex = headers.findIndex((header) => aliases.includes(header));

  if (headerIndex === -1) {
    return null;
  }

  return normalizeOptionalText(values[headerIndex]);
}

function parseImportedOfficeLocations(content: string) {
  const { headers, rows } = readDelimitedRows(content);
  const locations: ImportedOfficeLocation[] = [];

  for (const [index, row] of rows.entries()) {
    const locationName = getCellValue(headers, row, [
      'location',
      'location name',
      'office',
      'office name',
      'clinic',
      'clinic name',
      'site',
      'site name'
    ]);

    if (!locationName) {
      continue;
    }

    locations.push({
      company: getCellValue(headers, row, ['company', 'company name', 'organization']),
      locationId: getCellValue(headers, row, [
        'location id',
        'location_id',
        'clinic id',
        'site id'
      ]),
      locationName,
      streetAddress: getCellValue(headers, row, [
        'street address',
        'street',
        'address',
        'address 1',
        'address1'
      ]),
      city: getCellValue(headers, row, ['city']),
      state: getCellValue(headers, row, ['state', 'province']),
      zip: getCellValue(headers, row, ['zip', 'zip code', 'postal code']),
      phone: getCellValue(headers, row, ['phone', 'phone number', 'telephone']),
      notes: getCellValue(headers, row, ['notes', 'note', 'comments']),
      region: getCellValue(headers, row, ['region']),
      servicesOffered: normalizeServicesOffered(
        getCellValue(headers, row, [
          'services offered',
          'services_offered',
          'services',
          'service lines'
        ])
      ),
      activeFlag: normalizeBooleanFlag(
        getCellValue(headers, row, ['active flag', 'active_flag', 'active', 'is active'])
      ) ?? true
    });

    locations[index]!.locationId ??= buildLocationCode({
      company: locations[index]!.company,
      locationName,
      sequence: index + 1
    });
  }

  if (locations.length === 0) {
    throw new Error(
      'No valid location rows were found. Include at least a Location Name column.'
    );
  }

  return locations;
}

async function ensureProviderLocationParent(
  tx: Prisma.TransactionClient,
  tenant: Tenant
) {
  const units = await tx.organizationUnit.findMany({
    where: {
      tenantId: tenant.id
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  });

  const existingRegion = units.find((unit) => unit.type === 'REGION');

  if (existingRegion) {
    return existingRegion;
  }

  const enterprise =
    units.find((unit) => unit.type === 'ENTERPRISE') ??
    (await createOrganizationUnit(
      {
        tenantId: tenant.id,
        type: 'ENTERPRISE',
        name: tenant.name
      },
      tx
    ));

  return createOrganizationUnit(
    {
      tenantId: tenant.id,
      parentId: enterprise.id,
      type: 'REGION',
      name: 'Imported Office Locations'
    },
    tx
  );
}

function normalizeLocationName(value: string) {
  return value.trim().toLowerCase();
}

function readOfficeLocationMetadata(
  value: Prisma.JsonValue | null | undefined
): OfficeLocationMetadata {
  return isRecord(value) ? (value as OfficeLocationMetadata) : {};
}

function buildOfficeLocationMetadata(
  input: ImportedOfficeLocation | OfficeLocationUpdateInput,
  existing: OfficeLocationMetadata = {}
) {
  return {
    importSource: 'office-location-file',
    locationId: normalizeOptionalText(input.locationId) ?? existing.locationId ?? null,
    company: normalizeOptionalText(input.company) ?? existing.company ?? null,
    address: {
      streetAddress:
        normalizeOptionalText(input.streetAddress) ?? existing.address?.streetAddress ?? null,
      city: normalizeOptionalText(input.city) ?? existing.address?.city ?? null,
      state: normalizeOptionalText(input.state) ?? existing.address?.state ?? null,
      zip: normalizeOptionalText(input.zip) ?? existing.address?.zip ?? null
    },
    phone: normalizeOptionalText(input.phone) ?? existing.phone ?? null,
    notes: normalizeOptionalText(input.notes) ?? existing.notes ?? null,
    region: normalizeOptionalText(input.region) ?? existing.region ?? null,
    servicesOffered:
      ('servicesOffered' in input && input.servicesOffered !== undefined
        ? input.servicesOffered
        : existing.servicesOffered) ?? [],
    activeFlag:
      ('activeFlag' in input && input.activeFlag !== undefined
        ? input.activeFlag
        : existing.activeFlag) ?? true
  } satisfies Prisma.InputJsonValue;
}

export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  return tenants
    .filter((tenant) => {
      const brandingConfig = isRecord(tenant.brandingConfig)
        ? tenant.brandingConfig
        : {};
      const lifecycle = isRecord(brandingConfig.lifecycle)
        ? (brandingConfig.lifecycle as TenantLifecycleConfig)
        : {};

      return typeof lifecycle.deletedAt !== 'string';
    })
    .map(mapTenant);
}

export async function getTenantById(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  return tenant ? mapTenant(tenant) : null;
}

export async function listTenantOrganizationUnits(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const organizationUnits = await prisma.organizationUnit.findMany({
    where: {
      tenantId
    },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
  });

  return organizationUnits.map((unit) => ({
    id: unit.id,
    tenantId: unit.tenantId,
    parentId: unit.parentId,
    type: unit.type,
    name: unit.name,
    metadata: unit.metadata,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt
  }));
}

export async function importTenantOfficeLocations(
  tenantId: string,
  file: MultipartFile,
  context: AuditContext = {}
): Promise<OfficeLocationImportResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.type !== 'PROVIDER') {
    throw new Error('Office location import is only available for Provider tenants.');
  }

  const content = (await file.toBuffer()).toString('utf-8');
  const importedLocations = parseImportedOfficeLocations(content);

  return prisma.$transaction(async (tx) => {
    const parentUnit = await ensureProviderLocationParent(tx, tenant);
    const existingLocations = await tx.organizationUnit.findMany({
      where: {
        tenantId,
        type: 'LOCATION',
        parentId: parentUnit.id
      }
    });
    const existingByName = new Map(
      existingLocations.map((unit) => [normalizeLocationName(unit.name), unit])
    );

    const createdLocations: OfficeLocationImportResult['createdLocations'] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const location of importedLocations) {
      const existing = existingByName.get(normalizeLocationName(location.locationName));

      if (existing) {
        const metadata = buildOfficeLocationMetadata(
          location,
          readOfficeLocationMetadata(existing.metadata)
        );

        await tx.organizationUnit.update({
          where: {
            id: existing.id
          },
          data: {
            metadata
          }
        });
        updatedCount += 1;
        continue;
      }

      const metadata = buildOfficeLocationMetadata(location);
      const created = await createOrganizationUnit(
        {
          tenantId,
          parentId: parentUnit.id,
          type: 'LOCATION',
          name: location.locationName,
          metadata
        },
        tx
      );

      existingByName.set(normalizeLocationName(created.name), created);
      createdLocations.push({
        id: created.id,
        name: created.name,
        parentId: created.parentId,
        type: created.type
      });
      createdCount += 1;
    }

    await logAdminAction({
      client: tx,
      tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.organization_units.imported',
      resourceType: 'organization_unit',
      resourceId: parentUnit.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        delimiterSource: file.mimetype,
        fileName: file.filename,
        importedRowCount: importedLocations.length,
        createdCount,
        updatedCount,
        skippedCount
      }
    });

    return {
      createdCount,
      createdLocations,
      parentOrganizationUnitId: parentUnit.id,
      skippedCount,
      updatedCount
    };
  });
}

export async function updateTenantOfficeLocation(
  tenantId: string,
  organizationUnitId: string,
  input: OfficeLocationUpdateInput,
  context: AuditContext = {}
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.type !== 'PROVIDER') {
    throw new Error('Office location editing is only available for Provider tenants.');
  }

  const existing = await prisma.organizationUnit.findFirst({
    where: {
      tenantId,
      id: organizationUnitId,
      type: 'LOCATION'
    }
  });

  if (!existing) {
    throw new Error('Office location not found for tenant.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextUnit = await updateOrganizationUnit(
      {
        id: organizationUnitId,
        tenantId,
        name: input.name?.trim() ? input.name : undefined,
        metadata: buildOfficeLocationMetadata(input, readOfficeLocationMetadata(existing.metadata))
      },
      tx
    );

    await logAdminAction({
      client: tx,
      tenantId,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.organization_unit.updated',
      resourceType: 'organization_unit',
      resourceId: nextUnit.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        type: nextUnit.type,
        name: nextUnit.name,
        locationId:
          readOfficeLocationMetadata(nextUnit.metadata).locationId ?? null
      }
    });

    return nextUnit;
  });

  return {
    id: updated.id,
    tenantId: updated.tenantId,
    parentId: updated.parentId,
    type: updated.type,
    name: updated.name,
    metadata: updated.metadata,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}

export async function createTenant(
  input: TenantInput,
  context: AuditContext = {}
) {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug);

  if (!name) {
    throw new Error('Tenant name is required');
  }

  if (!slug) {
    throw new Error('Tenant slug is required');
  }

  const type = normalizeTenantType(input.type);
  await syncTenantTypeDefinitions(prisma);

  let tenant: Tenant;

  try {
    tenant = await prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name,
          slug,
          status: input.status,
          type,
          tenantTypeCode: type,
          isActive: input.status === 'ACTIVE',
          brandingConfig: input.brandingConfig as Prisma.InputJsonValue
        }
      });

      await logAdminAction({
        client: tx,
        tenantId: createdTenant.id,
        actorUserId: context.actorUserId ?? null,
        action: 'tenant.created',
        resourceType: 'tenant',
        resourceId: createdTenant.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      });

      return createdTenant;
    });
  } catch (error) {
    if (isTenantSlugConflict(error)) {
      throw new Error(`Tenant slug '${slug}' already exists.`);
    }

    throw error;
  }

  publishInBackground('tenant.created', {
    capabilityId: 'platform.tenants',
    id: randomUUID(),
    correlationId: randomUUID(),
    failureType: 'none',
    orgUnitId: null,
    timestamp: new Date(),
    tenantId: tenant.id,
    type: 'tenant.created',
    payload: {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      tenantType: tenant.type
    }
  });

  return mapTenant(tenant);
}

export async function updateTenant(
  id: string,
  input: TenantUpdateInput,
  context: AuditContext = {}
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentBrandingConfig: BrandingConfig = isRecord(tenant.brandingConfig)
    ? tenant.brandingConfig
    : {};
  const currentPlatformQuota = isRecord(currentBrandingConfig.platformQuota)
    ? currentBrandingConfig.platformQuota
    : {};

  const nextPlatformQuota = {
    ...currentPlatformQuota,
    ...(typeof input.quotaMembers === 'number'
      ? { members: input.quotaMembers }
      : {}),
    ...(typeof input.quotaUsers === 'number'
      ? { users: input.quotaUsers }
      : {}),
    ...(typeof input.quotaStorageGb === 'number'
      ? { storageGb: input.quotaStorageGb }
      : {})
  };

  const nextBrandingConfig = {
    ...currentBrandingConfig,
    ...(Object.keys(nextPlatformQuota).length > 0
      ? { platformQuota: nextPlatformQuota }
      : {})
  };

  const updatedTenant = await prisma.$transaction(async (tx) => {
    const nextType =
      input.type !== undefined ? normalizeTenantType(input.type) : tenant.type;

    const nextTenant = await tx.tenant.update({
      where: { id },
      data: {
        ...(input.status
          ? {
              status: input.status,
              isActive: input.status === 'ACTIVE'
            }
          : {}),
        type: nextType,
        tenantTypeCode: nextType,
        brandingConfig: nextBrandingConfig as Prisma.InputJsonValue
      }
    });

    await logAdminAction({
      client: tx,
      tenantId: nextTenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.updated',
      resourceType: 'tenant',
      resourceId: nextTenant.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        updatedFields: [
          ...(input.status ? ['status'] : []),
          ...(input.type ? ['type'] : []),
          ...(typeof input.quotaMembers === 'number'
            ? ['brandingConfig.platformQuota.members']
            : []),
          ...(typeof input.quotaUsers === 'number'
            ? ['brandingConfig.platformQuota.users']
            : []),
          ...(typeof input.quotaStorageGb === 'number'
            ? ['brandingConfig.platformQuota.storageGb']
            : [])
        ]
      }
    });

    return nextTenant;
  });

  return mapTenant(updatedTenant);
}

export async function uploadTenantLogo(
  id: string,
  file: MultipartFile,
  context: AuditContext = {}
) {
  if (!file.mimetype.startsWith('image/')) {
    throw new Error('Logo upload must be an image file');
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const extension = getExtension(file.filename, file.mimetype);
  const fileName = `tenant-logo${extension}`;
  const storageKey = buildTenantLogoStorageKey({
    tenantId: tenant.id,
    fileName
  });
  const uploadResult = await getPublicAssetStorageService().put(
    storageKey,
    await file.toBuffer(),
    {
      contentType: file.mimetype
    }
  );

  if (!uploadResult.publicUrl) {
    throw new Error(
      'Public asset storage must return a public URL for tenant logos'
    );
  }

  const currentBrandingConfig: BrandingConfig = isRecord(tenant.brandingConfig)
    ? tenant.brandingConfig
    : {};

  const updatedBrandingConfig = {
    ...currentBrandingConfig,
    logoUrl: uploadResult.publicUrl
  };

  const updatedTenant = await prisma.$transaction(async (tx) => {
    const nextTenant = await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        brandingConfig: updatedBrandingConfig as Prisma.InputJsonValue
      }
    });

    await logAdminAction({
      client: tx,
      tenantId: nextTenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.updated',
      resourceType: 'tenant',
      resourceId: nextTenant.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        updatedFields: ['brandingConfig.logoUrl']
      }
    });

    return nextTenant;
  });

  publishInBackground('document.uploaded', {
    capabilityId: 'platform.tenants',
    id: randomUUID(),
    correlationId: randomUUID(),
    failureType: 'none',
    orgUnitId: null,
    timestamp: new Date(),
    tenantId: updatedTenant.id,
    type: 'document.uploaded',
    payload: {
      documentId: `${updatedTenant.id}-logo`,
      fileName,
      contentType: file.mimetype,
      uploadedByUserId: context.actorUserId ?? null
    }
  });

  return mapTenant(updatedTenant);
}

export async function archiveTenant(
  id: string,
  context: AuditContext = {}
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (tenant.status !== 'INACTIVE') {
    throw new Error('Tenant must be inactive before it can be archived');
  }

  const currentBrandingConfig: BrandingConfig = isRecord(tenant.brandingConfig)
    ? tenant.brandingConfig
    : {};
  const currentLifecycle = isRecord(currentBrandingConfig.lifecycle)
    ? (currentBrandingConfig.lifecycle as TenantLifecycleConfig)
    : {};

  if (typeof currentLifecycle.archivedAt === 'string') {
    return mapTenant(tenant);
  }

  const updatedTenant = await prisma.$transaction(async (tx) => {
    const nextTenant = await tx.tenant.update({
      where: { id },
      data: {
        brandingConfig: {
          ...currentBrandingConfig,
          lifecycle: {
            ...currentLifecycle,
            archivedAt: new Date().toISOString(),
            archivedByUserId: context.actorUserId ?? null
          }
        } satisfies Prisma.InputJsonValue
      }
    });

    await logAdminAction({
      client: tx,
      tenantId: nextTenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.archived',
      resourceType: 'tenant',
      resourceId: nextTenant.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    });

    return nextTenant;
  });

  return mapTenant(updatedTenant);
}

export async function deleteTenant(
  id: string,
  context: AuditContext = {}
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const currentBrandingConfig: BrandingConfig = isRecord(tenant.brandingConfig)
    ? tenant.brandingConfig
    : {};
  const currentLifecycle = isRecord(currentBrandingConfig.lifecycle)
    ? (currentBrandingConfig.lifecycle as TenantLifecycleConfig)
    : {};

  if (tenant.status !== 'INACTIVE') {
    throw new Error('Tenant must be inactive before it can be deleted');
  }

  if (typeof currentLifecycle.archivedAt !== 'string') {
    throw new Error('Tenant must be archived before it can be deleted');
  }

  if (typeof currentLifecycle.deletedAt === 'string') {
    return {
      id: tenant.id,
      deleted: true
    };
  }

  const deletedAt = new Date().toISOString();
  const deletedSlug = `${tenant.slug}-deleted-${tenant.id.slice(0, 8)}`;
  const deletedName = `${tenant.name} (Deleted)`;

  await prisma.$transaction(async (tx) => {
    await logAdminAction({
      client: tx,
      tenantId: tenant.id,
      actorUserId: context.actorUserId ?? null,
      action: 'tenant.deleted',
      resourceType: 'tenant',
      resourceId: tenant.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        slug: tenant.slug,
        status: tenant.status
      }
    });

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        name: deletedName,
        slug: deletedSlug,
        brandingConfig: {
          ...(currentBrandingConfig as Prisma.InputJsonObject),
          lifecycle: {
            ...currentLifecycle,
            deletedAt,
            deletedByUserId: context.actorUserId ?? null
          }
        }
      }
    });
  });

  return {
    id: tenant.id,
    deleted: true
  };
}
