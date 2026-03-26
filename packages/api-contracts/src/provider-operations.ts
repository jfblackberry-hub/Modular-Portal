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

export type ProviderOperationsUrgency = 'critical' | 'high' | 'medium' | 'steady';
export type ProviderOperationsDeliverySetting = 'clinic' | 'home' | 'school' | 'community';
export type ProviderOperationsSessionStatus =
  | 'confirmed'
  | 'open_slot'
  | 'cancelled'
  | 'at_risk'
  | 'documentation_needed'
  | 'ready';
export type ProviderOperationsAuthorizationStatus =
  | 'active'
  | 'due_soon'
  | 'low_visits'
  | 'pending'
  | 'denied'
  | 'expired';
export type ProviderOperationsClaimStatus =
  | 'submitted'
  | 'in_review'
  | 'adjudicated'
  | 'paid'
  | 'denied'
  | 'resubmitted'
  | 'pending_resubmission';

export interface ProviderOperationsScopedMetric {
  organizationUnitId: string | null;
  label: string;
  summary: string;
  detail: string;
  highlights: string[];
  tone?: ProviderOperationsWidgetTone;
}

export interface ProviderOperationsOrganizationUnitOption {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface ProviderOperationsQuickAction {
  id: 'eligibility_check' | 'create_authorization' | 'submit_claim' | 'check_claim_status';
  label: string;
  description: string;
  href: string;
}

export interface ProviderOperationsAttentionItem {
  id:
    | 'auths_due_soon'
    | 'expired_but_scheduled'
    | 'claims_denied_today'
    | 'claims_needing_resubmission'
    | 'eligibility_missing'
    | 'schedule_gaps'
    | 'overloaded_staff'
    | 'low_remaining_visits'
    | 'sessions_at_risk';
  label: string;
  count: number;
  urgency: ProviderOperationsUrgency;
  summary: string;
  detail: string;
  href: string;
  preview: string[];
}

export interface ProviderOperationsSummaryMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: ProviderOperationsWidgetTone;
  href: string;
}

export interface ProviderOperationsSessionRecord {
  id: string;
  organizationUnitId: string;
  organizationUnitName: string;
  setting: ProviderOperationsDeliverySetting;
  patientName: string;
  caseName: string;
  therapistName: string;
  supervisingClinicianName: string;
  startTime: string;
  endTime: string;
  status: ProviderOperationsSessionStatus;
  issueFlags: string[];
  nextAction: string;
}

export interface ProviderOperationsAuthorizationRecord {
  id: string;
  organizationUnitId: string;
  organizationUnitName: string;
  patientName: string;
  caseName: string;
  payerName: string;
  therapistName: string;
  supervisingClinicianName: string;
  status: ProviderOperationsAuthorizationStatus;
  startDate: string;
  endDate: string;
  remainingVisits: number;
  upcomingScheduledSessions: number;
  followUpStatus: string;
  noteCount: number;
  documentCount: number;
  nextAction: string;
}

export interface ProviderOperationsUtilizationRecord {
  id: string;
  organizationUnitId: string;
  organizationUnitName: string;
  therapistName: string;
  roleLabel: string;
  utilizationPercent: number;
  scheduledSessions: number;
  weeklyCapacity: number;
  openCoverageGaps: number;
  atRiskSessions: number;
  tone: ProviderOperationsWidgetTone;
  nextAction: string;
}

export interface ProviderOperationsClaimRecord {
  id: string;
  organizationUnitId: string;
  organizationUnitName: string;
  patientName: string;
  caseName: string;
  therapistName: string;
  dateOfService: string;
  amount: number;
  payerName: string;
  status: ProviderOperationsClaimStatus;
  denialReason: string | null;
  nextAction: string;
  resubmissionStatus: string | null;
  ageInDays: number;
}

export interface ProviderOperationsClaimsPipelineMetric {
  status: ProviderOperationsClaimStatus;
  label: string;
  count: number;
}

export interface ProviderOperationsDenialReasonMetric {
  reason: string;
  count: number;
  amountAtRisk: number;
}

export interface ProviderOperationsSchedulingSection {
  metrics: ProviderOperationsSummaryMetric[];
  sessions: ProviderOperationsSessionRecord[];
}

export interface ProviderOperationsAuthorizationsSection {
  metrics: ProviderOperationsSummaryMetric[];
  authorizations: ProviderOperationsAuthorizationRecord[];
}

export interface ProviderOperationsUtilizationSection {
  metrics: ProviderOperationsSummaryMetric[];
  therapists: ProviderOperationsUtilizationRecord[];
}

export interface ProviderOperationsClaimsSection {
  metrics: ProviderOperationsSummaryMetric[];
  claims: ProviderOperationsClaimRecord[];
  pipeline: ProviderOperationsClaimsPipelineMetric[];
  denialReasons: ProviderOperationsDenialReasonMetric[];
  dollarAmountAtRisk: number;
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
  generatedAt: string;
  refreshIntervalSeconds: number;
  alertsCount: number;
  organizationUnits: ProviderOperationsOrganizationUnitOption[];
  quickActions: ProviderOperationsQuickAction[];
  attentionItems: ProviderOperationsAttentionItem[];
  widgets: ProviderOperationsWidgetContract[];
  scheduling: ProviderOperationsSchedulingSection;
  authorizations: ProviderOperationsAuthorizationsSection;
  utilization: ProviderOperationsUtilizationSection;
  claims: ProviderOperationsClaimsSection;
}
