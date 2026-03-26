export type ProviderOperationsSourceType =
  | 'google_cloud_warehouse'
  | 'clearinghouse_environment'
  | 'central_reach';

export type ProviderOperationsWidgetId =
  | 'scheduling'
  | 'authorizations'
  | 'claims'
  | 'billing'
  | 'utilization';

export type ProviderOperationsWidgetTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type ProviderOperationsWidgetScopeMode = 'organization_unit' | 'rollup';

export interface ProviderOperationsScopedMetric {
  organizationUnitId: string | null;
  label: string;
  summary: string;
  detail: string;
  highlights: string[];
  tone?: ProviderOperationsWidgetTone;
}

export interface GoogleCloudWarehouseProviderOperationsContract {
  sourceType: 'google_cloud_warehouse';
  warehouseDataset: string;
  generatedAt: string;
  tenantId: string;
  scheduling: ProviderOperationsScopedMetric[];
  utilization: ProviderOperationsScopedMetric[];
}

export interface ClearinghouseProviderOperationsContract {
  sourceType: 'clearinghouse_environment';
  environment: 'sandbox' | 'staging' | 'production';
  generatedAt: string;
  tenantId: string;
  authorizations: ProviderOperationsScopedMetric[];
  claims: ProviderOperationsScopedMetric[];
  billing: ProviderOperationsScopedMetric[];
}

export interface CentralReachProviderOperationsContract {
  sourceType: 'central_reach';
  generatedAt: string;
  tenantId: string;
  scheduling: ProviderOperationsScopedMetric[];
  utilization: ProviderOperationsScopedMetric[];
}

export type ProviderOperationsSourceContract =
  | GoogleCloudWarehouseProviderOperationsContract
  | ClearinghouseProviderOperationsContract
  | CentralReachProviderOperationsContract;

export interface ProviderOperationsWidgetContract {
  id: ProviderOperationsWidgetId;
  title: string;
  description: string;
  summary: string;
  detail: string;
  highlights: string[];
  tone: ProviderOperationsWidgetTone;
  href?: string;
  ctaLabel?: string;
  scope: {
    mode: ProviderOperationsWidgetScopeMode;
    tenantId: string;
    activeOrganizationUnitId: string | null;
    accessibleOrganizationUnitIds: string[];
    rollupAuthorized: boolean;
  };
  sourceTypes: ProviderOperationsSourceType[];
}

export interface ProviderOperationsDashboardContract {
  source: 'platform_provider_operations_data_layer';
  personaCode: string;
  tenantId: string;
  activeOrganizationUnitId: string | null;
  widgets: ProviderOperationsWidgetContract[];
  generatedAt: string;
}
