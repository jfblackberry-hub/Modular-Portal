import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import type { Prisma, PrismaClient, TenantType, UserLifecycleStatus } from '@prisma/client';
import {
  CORE_TENANT_TYPES,
  normalizeTenantTypeForArchitecture,
  PROVIDER_CLASS_TENANT_TYPES
} from '@payer-portal/shared-types';

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_TENANT_TYPE_DEFINITIONS: Array<{
  code: string;
  enumValue: TenantType;
  name: string;
  description: string;
}> = [
  {
    code: 'PAYER',
    enumValue: 'PAYER',
    name: 'Payer',
    description: 'Insurance carrier and payer administration tenant.'
  },
  {
    code: 'CLINIC',
    enumValue: 'CLINIC',
    name: 'Clinic',
    description:
      'Clinic tenant with provider-class isolation, Organization Units, and centralized operations.'
  },
  {
    code: 'PHYSICIAN_GROUP',
    enumValue: 'PHYSICIAN_GROUP',
    name: 'Physician Group',
    description:
      'Physician Group tenant sharing the provider-class internal structure with clinic and hospital tenants.'
  },
  {
    code: 'HOSPITAL',
    enumValue: 'HOSPITAL',
    name: 'Hospital',
    description:
      'Hospital tenant sharing the provider-class internal structure with clinic and physician group tenants.'
  },
  {
    code: 'PROVIDER',
    enumValue: 'PROVIDER',
    name: 'Provider (Legacy)',
    description:
      'Deprecated legacy tenant type. Standalone provider-style tenants are normalized to Clinic during architectural correction.'
  }
] as const;

export function normalizeTenantTypeCode(
  value: TenantType | string | null | undefined,
  fallback?: TenantType
): TenantType | undefined {
  const normalized =
    normalizeTenantTypeForArchitecture(value) ??
    normalizeTenantTypeForArchitecture(fallback ?? null);

  if (!normalized) {
    return undefined;
  }

  return normalized as TenantType;
}

export function isProviderClassTenantTypeCode(value: string | null | undefined) {
  const normalized = normalizeTenantTypeForArchitecture(value);
  return normalized
    ? PROVIDER_CLASS_TENANT_TYPES.some((tenantType) => tenantType === normalized)
    : false;
}

export function getCompatibleTenantTypeCodes(value: string | null | undefined) {
  const normalized = normalizeTenantTypeForArchitecture(value);

  if (!normalized) {
    return [];
  }

  if (PROVIDER_CLASS_TENANT_TYPES.some((tenantType) => tenantType === normalized)) {
    return [...PROVIDER_CLASS_TENANT_TYPES] as TenantType[];
  }

  if (CORE_TENANT_TYPES.some((tenantType) => tenantType === normalized)) {
    return [normalized as TenantType];
  }

  return [normalized as TenantType];
}

export function normalizeUserLifecycleStatus(
  value: UserLifecycleStatus | string | null | undefined,
  fallback: UserLifecycleStatus = 'ACTIVE'
): UserLifecycleStatus {
  const normalized = value?.trim().toUpperCase();

  if (normalized === 'INVITED' || normalized === 'ACTIVE' || normalized === 'DISABLED') {
    return normalized;
  }

  return fallback;
}

export async function syncTenantTypeDefinitions(client: DatabaseClient) {
  await Promise.all(
    DEFAULT_TENANT_TYPE_DEFINITIONS.map((tenantType) =>
      client.tenantTypeDefinition.upsert({
        where: {
          code: tenantType.code
        },
        update: {
          enumValue: tenantType.enumValue,
          name: tenantType.name,
          description: tenantType.description
        },
        create: tenantType
      })
    )
  );
}

export function hashPassword(password: string) {
  const normalized = password.trim();

  if (normalized.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(normalized, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, expectedHex] = storedHash.split(':');

  if (scheme !== 'scrypt' || !salt || !expectedHex) {
    return false;
  }

  const actual = scryptSync(password.trim(), salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
