export interface TenantSummary {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'onboarding' | 'inactive';
  type: TenantType;
}

export const CORE_TENANT_TYPES = [
  'PAYER',
  'CLINIC',
  'PHYSICIAN_GROUP',
  'HOSPITAL'
] as const;

export const PROVIDER_CLASS_TENANT_TYPES = [
  'CLINIC',
  'PHYSICIAN_GROUP',
  'HOSPITAL'
] as const;

export const TENANT_TYPES = [...CORE_TENANT_TYPES] as const;

export type TenantType = (typeof TENANT_TYPES)[number];
export type CoreTenantType = (typeof CORE_TENANT_TYPES)[number];
export type ProviderClassTenantType = (typeof PROVIDER_CLASS_TENANT_TYPES)[number];

export function isCoreTenantType(value: string | null | undefined): value is CoreTenantType {
  return CORE_TENANT_TYPES.includes(value as CoreTenantType);
}

export function isProviderClassTenantType(
  value: string | null | undefined
): value is ProviderClassTenantType {
  return PROVIDER_CLASS_TENANT_TYPES.includes(value as ProviderClassTenantType);
}

export function normalizeTenantTypeForArchitecture(
  value: string | null | undefined
): TenantType | null {
  const normalized = value?.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'PROVIDER') {
    return 'CLINIC';
  }

  if (
    normalized === 'EMPLOYER' ||
    normalized === 'BROKER' ||
    normalized === 'MEMBER'
  ) {
    return 'PAYER';
  }

  return TENANT_TYPES.includes(normalized as TenantType)
    ? (normalized as TenantType)
    : null;
}

export function getCompatibleTenantTypeCodes(
  value: string | null | undefined
) {
  const normalized = normalizeTenantTypeForArchitecture(value);

  if (!normalized) {
    return [];
  }

  if (isProviderClassTenantType(normalized)) {
    return [...PROVIDER_CLASS_TENANT_TYPES];
  }

  return [normalized];
}

export const ORGANIZATION_UNIT_TYPES = [
  'ENTERPRISE',
  'REGION',
  'LOCATION',
  'DEPARTMENT',
  'TEAM'
] as const;

export type OrganizationUnitType = (typeof ORGANIZATION_UNIT_TYPES)[number];

export interface OrganizationUnit {
  id: string;
  tenantId: string;
  parentId: string | null;
  type: OrganizationUnitType;
  name: string;
}

export interface OrganizationUnitInput {
  tenantId: string;
  parentId?: string | null;
  type: OrganizationUnitType;
  name: string;
}

export interface PortalUser {
  id: string;
  email: string;
  displayName: string;
  role: 'member' | 'admin' | 'support';
  tenantId: string;
}

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  checkedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export * from './publicAuthRoutes.js';
