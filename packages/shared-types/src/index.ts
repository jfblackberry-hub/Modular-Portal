export interface TenantSummary {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'onboarding' | 'inactive';
  type: TenantType;
}

export const TENANT_TYPES = [
  'PAYER',
  'EMPLOYER',
  'BROKER',
  'MEMBER',
  'PROVIDER'
] as const;

export type TenantType = (typeof TENANT_TYPES)[number];

export const ORGANIZATION_UNIT_TYPES = [
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
