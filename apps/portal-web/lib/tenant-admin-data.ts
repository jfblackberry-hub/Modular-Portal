import {
  getAdminAuditEventsForTenant,
  getAdminModules,
  getAdminNotificationPreferencesForTenant,
  getAdministratorsForTenant,
  getBillingPreferencesForTenant,
  getEmployerAdministrationSummaryForTenant,
  getEmployerProfileForTenant,
  getIntegrationConfigsForTenant,
  getRolePermissionMatrixForTenant,
  type AdminAuditEvent,
  type AdminModule,
  type AdminNotificationPreferences,
  type AdministratorUser,
  type BillingPreferences,
  type EmployerAdministrationSummary,
  type EmployerProfile,
  type IntegrationConfig,
  type RolePermissionMatrix
} from './employer-admin-settings-data';

export type TenantSubtenant = {
  id: string;
  name: string;
  status: 'Active' | 'Pending' | 'Needs Review';
  memberCount: number;
  adminCount: number;
  lastUpdated: string;
};

export type TenantAdminWorkspaceData = {
  summary: EmployerAdministrationSummary;
  profile: EmployerProfile;
  notifications: AdminNotificationPreferences;
  billingPreferences: BillingPreferences;
  integrations: IntegrationConfig[];
  administrators: AdministratorUser[];
  rolePermissions: RolePermissionMatrix;
  adminModules: AdminModule[];
  auditEvents: AdminAuditEvent[];
  subtenants: TenantSubtenant[];
};

function buildSubtenantsForTenant(tenantId: string, tenantName: string): TenantSubtenant[] {
  const tenantKey = tenantId.slice(0, 4).toUpperCase() || 'TNNT';

  return [
    {
      id: `${tenantId}-north`,
      name: `${tenantName} North Division`,
      status: 'Active',
      memberCount: 1840,
      adminCount: 4,
      lastUpdated: '2026-03-18T13:15:00Z'
    },
    {
      id: `${tenantId}-central`,
      name: `${tenantName} Central Clinic Group`,
      status: 'Active',
      memberCount: 920,
      adminCount: 3,
      lastUpdated: '2026-03-17T10:40:00Z'
    },
    {
      id: `${tenantId}-south`,
      name: `${tenantKey} South Shared Services`,
      status: tenantId.length % 2 === 0 ? 'Pending' : 'Needs Review',
      memberCount: 412,
      adminCount: 2,
      lastUpdated: '2026-03-16T16:05:00Z'
    }
  ];
}

export function getTenantAdminWorkspaceData(
  tenantId: string,
  tenantName: string
): TenantAdminWorkspaceData {
  return {
    summary: getEmployerAdministrationSummaryForTenant(tenantId),
    profile: getEmployerProfileForTenant(tenantId, tenantName),
    notifications: getAdminNotificationPreferencesForTenant(tenantId),
    billingPreferences: getBillingPreferencesForTenant(tenantId),
    integrations: getIntegrationConfigsForTenant(tenantId),
    administrators: getAdministratorsForTenant(tenantId),
    rolePermissions: getRolePermissionMatrixForTenant(tenantId),
    adminModules: getAdminModules(),
    auditEvents: getAdminAuditEventsForTenant(tenantId),
    subtenants: buildSubtenantsForTenant(tenantId, tenantName)
  };
}
