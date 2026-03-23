import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { MultipartFile } from '@fastify/multipart';
import type { Prisma, Tenant } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import {
  buildTenantLogoStorageKey,
  getPublicAssetStorageService,
  logAdminAction,
  publishInBackground} from '@payer-portal/server';

type TenantInput = {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  brandingConfig: Record<string, unknown>;
};

type TenantUpdateInput = {
  status?: 'ACTIVE' | 'ONBOARDING' | 'INACTIVE';
  quotaUsers?: number;
  quotaMembers?: number;
  quotaStorageGb?: number;
};

type BrandingConfig = Record<string, unknown>;

type AuditContext = {
  actorUserId?: string | null;
  ipAddress?: string;
  userAgent?: string;
};

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

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
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
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt
  };
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

export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  return tenants.map(mapTenant);
}

export async function getTenantById(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  return tenant ? mapTenant(tenant) : null;
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

  const tenant = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({
      data: {
        name,
        slug,
        status: input.status,
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

  publishInBackground('tenant.created', {
    id: randomUUID(),
    correlationId: randomUUID(),
    timestamp: new Date(),
    tenantId: tenant.id,
    type: 'tenant.created',
    payload: {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status
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
    const nextTenant = await tx.tenant.update({
      where: { id },
      data: {
        ...(input.status
          ? {
              status: input.status,
              isActive: input.status === 'ACTIVE'
            }
          : {}),
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
    throw new Error('Public asset storage must return a public URL for tenant logos');
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
    id: randomUUID(),
    correlationId: randomUUID(),
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
