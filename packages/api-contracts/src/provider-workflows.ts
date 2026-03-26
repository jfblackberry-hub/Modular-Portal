export type ProviderWorkflowActionType =
  | 'claim_resubmission'
  | 'authorization_update'
  | 'operational_follow_up'
  | 'status_change';

export type ProviderWorkflowTargetType =
  | 'claim'
  | 'authorization'
  | 'billing_item'
  | 'operational_task';

export type ProviderWorkflowExecutionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface ProviderWorkflowActionRequest {
  actionType: ProviderWorkflowActionType;
  capabilityId: string;
  widgetId?: string;
  targetType: ProviderWorkflowTargetType;
  targetId: string;
  targetLabel?: string;
  reason?: string;
  payload?: Record<string, unknown>;
}

export interface ProviderWorkflowExecutionContract {
  id: string;
  tenantId: string;
  organizationUnitId: string | null;
  initiatedByUserId: string | null;
  capabilityId: string;
  widgetId: string | null;
  workflowType: string;
  actionType: ProviderWorkflowActionType;
  targetType: ProviderWorkflowTargetType;
  targetId: string;
  targetLabel: string | null;
  personaCode: string | null;
  status: ProviderWorkflowExecutionStatus;
  jobId: string | null;
  inputPayload: Record<string, unknown>;
  resultPayload: Record<string, unknown> | null;
  audit: {
    initiationAction: string;
    dispositionAction: string | null;
  };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
