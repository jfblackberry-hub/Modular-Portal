import type { FeatureFlag } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

type FeatureFlagInput = {
  key: string;
  enabled: boolean;
  tenantId?: string | null;
  description?: string;
};

type FeatureFlagPatch = {
  enabled?: boolean;
  tenantId?: string | null;
  description?: string;
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapFeatureFlag(
  featureFlag: FeatureFlag & {
    tenant: { id: string; name: string } | null;
  }
) {
  return {
    id: featureFlag.id,
    key: featureFlag.key,
    enabled: featureFlag.enabled,
    tenantId: featureFlag.tenantId,
    tenantName: featureFlag.tenant?.name ?? null,
    description: featureFlag.description,
    createdAt: featureFlag.createdAt,
    updatedAt: featureFlag.updatedAt
  };
}

async function ensureGlobalKeyAvailable(key: string, excludeId?: string) {
  const existing = await prisma.featureFlag.findFirst({
    where: {
      key,
      tenantId: null,
      id: excludeId ? { not: excludeId } : undefined
    }
  });

  if (existing) {
    throw new Error('A global feature flag with this key already exists');
  }
}

export async function listFeatureFlags() {
  const featureFlags = await prisma.featureFlag.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [{ key: 'asc' }, { createdAt: 'desc' }]
  });

  return featureFlags.map(mapFeatureFlag);
}

export async function createFeatureFlag(input: FeatureFlagInput) {
  const key = normalizeKey(input.key);

  if (!key) {
    throw new Error('Feature flag key is required');
  }

  if (!input.tenantId) {
    await ensureGlobalKeyAvailable(key);
  }

  const featureFlag = await prisma.featureFlag.create({
    data: {
      key,
      name: key,
      enabled: input.enabled,
      tenantId: input.tenantId ?? null,
      description: input.description?.trim() || null
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return mapFeatureFlag(featureFlag);
}

export async function updateFeatureFlag(id: string, input: FeatureFlagPatch) {
  const existing = await prisma.featureFlag.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new Error('Feature flag not found');
  }

  const nextTenantId =
    input.tenantId === undefined ? existing.tenantId : input.tenantId;

  if (!nextTenantId) {
    await ensureGlobalKeyAvailable(existing.key, id);
  }

  const featureFlag = await prisma.featureFlag.update({
    where: { id },
    data: {
      enabled: input.enabled ?? existing.enabled,
      tenantId: nextTenantId,
      description:
        input.description === undefined
          ? existing.description
          : input.description?.trim() || null
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return mapFeatureFlag(featureFlag);
}
