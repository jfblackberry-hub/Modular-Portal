import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import type { MultipartFile } from '@fastify/multipart';
import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';
import { logAuditEvent } from '@payer-portal/server';

const DEFAULT_PRIMARY_COLOR = '#38bdf8';
const DEFAULT_SECONDARY_COLOR = '#ffffff';
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const tenantAssetsDirectory = path.resolve(
  process.cwd(),
  '../portal-web/public/tenant-assets'
);

type BrandingInput = {
  displayName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
};

type AuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
};

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
    case 'image/x-icon':
      return '.ico';
    default:
      return '.bin';
  }
}

async function writeTenantImageAsset(input: {
  file: MultipartFile;
  fileName: string;
}) {
  if (!input.file.mimetype.startsWith('image/')) {
    throw new Error('Logo upload must be an image file');
  }

  await mkdir(tenantAssetsDirectory, { recursive: true });
  const extension = getExtension(input.file.filename, input.file.mimetype);
  const outputPath = path.join(tenantAssetsDirectory, `${input.fileName}${extension}`);
  await pipeline(input.file.file, (await import('node:fs')).createWriteStream(outputPath));

  return `/tenant-assets/${input.fileName}${extension}`;
}

function normalizeOptionalString(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function validateColor(value: string | null, fieldName: string) {
  if (!value) {
    return null;
  }

  if (!HEX_COLOR_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a valid hex color`);
  }

  return value.toLowerCase();
}

function validateUrl(value: string | null, fieldName: string) {
  if (!value) {
    return null;
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('unsupported protocol');
    }

    return value;
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }
}

function buildTenantBrandingConfig(input: {
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}) {
  return {
    displayName: input.displayName,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    ...(input.logoUrl ? { logoUrl: input.logoUrl } : {}),
    ...(input.faviconUrl ? { faviconUrl: input.faviconUrl } : {})
  } satisfies Prisma.InputJsonValue;
}

function mapBranding(tenant: {
  id: string;
  name: string;
  brandingConfig?: Prisma.JsonValue;
  branding: {
    id: string;
    displayName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}, options: {
  employerGroupName?: string | null;
  employerGroupLogoUrl?: string | null;
} = {}) {
  const brandingConfig =
    isRecord(tenant.brandingConfig) ? (tenant.brandingConfig as Record<string, unknown>) : {};
  const employerGroupName =
    typeof options.employerGroupName === 'string'
      ? options.employerGroupName
      : typeof brandingConfig.employerGroupName === 'string'
      ? brandingConfig.employerGroupName
      : typeof brandingConfig.employerName === 'string'
        ? brandingConfig.employerName
        : typeof brandingConfig.groupName === 'string'
          ? brandingConfig.groupName
          : null;
  const employerGroupLogoUrl =
    typeof options.employerGroupLogoUrl === 'string'
      ? options.employerGroupLogoUrl
      : typeof brandingConfig.employerGroupLogoUrl === 'string'
      ? brandingConfig.employerGroupLogoUrl
      : typeof brandingConfig.employerLogoUrl === 'string'
        ? brandingConfig.employerLogoUrl
        : null;

  return {
    id: tenant.branding?.id ?? null,
    tenantId: tenant.id,
    displayName: tenant.branding?.displayName ?? tenant.name,
    primaryColor: tenant.branding?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    secondaryColor: tenant.branding?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
    logoUrl: tenant.branding?.logoUrl ?? null,
    faviconUrl: tenant.branding?.faviconUrl ?? null,
    employerGroupName,
    employerGroupLogoUrl,
    createdAt: tenant.branding?.createdAt ?? null,
    updatedAt: tenant.branding?.updatedAt ?? null
  };
}

export async function getBrandingForTenant(tenantId: string, userId?: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      branding: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (!userId) {
    return mapBranding(tenant);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tenantId: true,
      employerGroup: {
        select: {
          name: true,
          logoUrl: true
        }
      }
    }
  });

  if (!user || user.tenantId !== tenant.id || !user.employerGroup) {
    return mapBranding(tenant);
  }

  return mapBranding(tenant, {
    employerGroupName: user.employerGroup.name,
    employerGroupLogoUrl: user.employerGroup.logoUrl
  });
}

export async function updateBrandingForTenant(
  tenantId: string,
  input: BrandingInput,
  context: AuditContext
) {
  const providedFields = (
    ['displayName', 'primaryColor', 'secondaryColor', 'logoUrl', 'faviconUrl'] as const
  ).filter((field) => field in input);

  if (providedFields.length === 0) {
    throw new Error('At least one branding field is required');
  }

  const updatedTenant = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branding: true
      }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const currentBrandingConfig = isRecord(tenant.brandingConfig)
      ? tenant.brandingConfig
      : {};

    const nextDisplayName =
      normalizeOptionalString(input.displayName) ?? tenant.branding?.displayName ?? tenant.name;
    const nextPrimaryColor = validateColor(
      normalizeOptionalString(input.primaryColor) ?? tenant.branding?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
      'primaryColor'
    );
    const nextSecondaryColor = validateColor(
      normalizeOptionalString(input.secondaryColor) ??
        tenant.branding?.secondaryColor ??
        DEFAULT_SECONDARY_COLOR,
      'secondaryColor'
    );
    const nextLogoUrl = validateUrl(
      normalizeOptionalString(input.logoUrl) ?? tenant.branding?.logoUrl ?? null,
      'logoUrl'
    );
    const nextFaviconUrl = validateUrl(
      normalizeOptionalString(input.faviconUrl) ?? tenant.branding?.faviconUrl ?? null,
      'faviconUrl'
    );

    const branding = await tx.tenantBranding.upsert({
      where: {
        tenantId: tenant.id
      },
      update: {
        displayName: nextDisplayName,
        primaryColor: nextPrimaryColor,
        secondaryColor: nextSecondaryColor,
        logoUrl: nextLogoUrl,
        faviconUrl: nextFaviconUrl
      },
      create: {
        tenantId: tenant.id,
        displayName: nextDisplayName,
        primaryColor: nextPrimaryColor,
        secondaryColor: nextSecondaryColor,
        logoUrl: nextLogoUrl,
        faviconUrl: nextFaviconUrl
      }
    });

    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        brandingConfig: {
          ...currentBrandingConfig,
          ...buildTenantBrandingConfig({
            displayName: nextDisplayName,
            primaryColor: nextPrimaryColor ?? DEFAULT_PRIMARY_COLOR,
            secondaryColor: nextSecondaryColor ?? DEFAULT_SECONDARY_COLOR,
            logoUrl: nextLogoUrl,
            faviconUrl: nextFaviconUrl
          })
        } satisfies Prisma.InputJsonValue
      }
    });

    await logAuditEvent({
      client: tx,
      tenantId: tenant.id,
      actorUserId: context.actorUserId,
      action: 'tenant.updated',
      entityType: 'tenant',
      entityId: tenant.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        updatedFields: providedFields
      }
    });

    return {
      ...tenant,
      branding
    };
  });

  return mapBranding(updatedTenant);
}

export async function uploadBrandingLogoForTenant(
  tenantId: string,
  file: MultipartFile,
  context: AuditContext
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      branding: true
    }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const logoUrl = await writeTenantImageAsset({
    file,
    fileName: `${tenant.id}-logo`
  });

  return updateBrandingForTenant(
    tenantId,
    {
      logoUrl
    },
    context
  );
}

export async function uploadEmployerGroupLogoAssetForTenant(
  tenantId: string,
  file: MultipartFile
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true }
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const logoUrl = await writeTenantImageAsset({
    file,
    fileName: `${tenant.id}-employer-group-logo`
  });

  return {
    tenantId,
    logoUrl
  };
}
