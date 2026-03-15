export interface TenantSummary {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'onboarding' | 'inactive';
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
