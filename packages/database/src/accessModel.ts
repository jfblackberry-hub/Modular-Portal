import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import type { Prisma, PrismaClient, TenantType, UserLifecycleStatus } from '@prisma/client';

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
    code: 'PROVIDER',
    enumValue: 'PROVIDER',
    name: 'Provider',
    description: 'Provider organization tenant with isolated practice operations.'
  },
  {
    code: 'EMPLOYER',
    enumValue: 'EMPLOYER',
    name: 'Employer',
    description: 'Employer tenant for billing, enrollment, and workforce administration.'
  },
  {
    code: 'BROKER',
    enumValue: 'BROKER',
    name: 'Broker',
    description: 'Broker tenant for agency and client portfolio operations.'
  },
  {
    code: 'MEMBER',
    enumValue: 'MEMBER',
    name: 'Member',
    description: 'Member-centric tenant type reserved for future direct member organizations.'
  }
] as const;

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
