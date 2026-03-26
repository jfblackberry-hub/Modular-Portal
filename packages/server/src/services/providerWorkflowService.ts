import { randomUUID } from 'node:crypto';

import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { publishInBackground } from '../events/eventBus.js';
import { enqueueJob } from '../jobs/jobQueue.js';
import { logAuditEvent } from './auditService.js';

type ProviderWorkflowActionType =
  | 'claim_resubmission'
  | 'authorization_update'
  | 'operational_follow_up'
  | 'status_change';

type ProviderWorkflowTargetType =
  | 'claim'
  | 'authorization'
  | 'billing_item'
  | 'operational_task';

type ProviderWorkflowExecutionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

type ProviderWorkflowActionRequest = {
  actionType: ProviderWorkflowActionType;
  capabilityId: string;
  widgetId?: string;
  targetType: ProviderWorkflowTargetType;
  targetId: string;
  targetLabel?: string;
  reason?: string;
  payload?: Record<string, unknown>;
};

type ProviderWorkflowExecutionContract = {
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
};

const PROVIDER_WORKFLOW_INITIATION_ACTION = 'provider.workflow.initiated';
const PROVIDER_WORKFLOW_SUCCEEDED_ACTION = 'provider.workflow.disposition.succeeded';
const PROVIDER_WORKFLOW_FAILED_ACTION = 'provider.workflow.disposition.failed';

const PROVIDER_WORKFLOW_PENDING_STATUS = 'PENDING';
const PROVIDER_WORKFLOW_IN_PROGRESS_STATUS = 'IN_PROGRESS';
const PROVIDER_WORKFLOW_SUCCEEDED_STATUS = 'SUCCEEDED';
const PROVIDER_WORKFLOW_FAILED_STATUS = 'FAILED';

function asRecord(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeRequired(value: string, fieldName: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

function buildWorkflowType(actionType: ProviderWorkflowActionRequest['actionType']) {
  return `provider.${actionType}`;
}

function buildWorkflowResultSummary(input: {
  actionType: ProviderWorkflowActionRequest['actionType'];
  targetType: ProviderWorkflowActionRequest['targetType'];
  targetLabel: string | null;
}) {
  const label = input.targetLabel ?? `${input.targetType} ${input.actionType.replaceAll('_', ' ')}`;

  switch (input.actionType) {
    case 'claim_resubmission':
      return `Centralized workflow queued claim resubmission for ${label}.`;
    case 'authorization_update':
      return `Centralized workflow processed authorization update for ${label}.`;
    case 'operational_follow_up':
      return `Centralized workflow created operational follow-up for ${label}.`;
    case 'status_change':
      return `Centralized workflow applied the requested status change for ${label}.`;
    default:
      return `Centralized workflow completed the requested provider action for ${label}.`;
  }
}

function mapProviderWorkflowExecution(
  execution: {
    id: string;
    tenantId: string;
    organizationUnitId: string | null;
    initiatedByUserId: string | null;
    capabilityId: string;
    widgetId: string | null;
    workflowType: string;
    actionType: string;
    targetType: string;
    targetId: string;
    targetLabel: string | null;
    personaCode: string | null;
    status: string;
    jobId: string | null;
    inputPayload: Prisma.JsonValue;
    resultPayload: Prisma.JsonValue | null;
    auditMetadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
  }
): ProviderWorkflowExecutionContract {
  const auditMetadata = asRecord(execution.auditMetadata);

  return {
    id: execution.id,
    tenantId: execution.tenantId,
    organizationUnitId: execution.organizationUnitId,
    initiatedByUserId: execution.initiatedByUserId,
    capabilityId: execution.capabilityId,
    widgetId: execution.widgetId,
    workflowType: execution.workflowType,
    actionType: execution.actionType as ProviderWorkflowExecutionContract['actionType'],
    targetType: execution.targetType as ProviderWorkflowExecutionContract['targetType'],
    targetId: execution.targetId,
    targetLabel: execution.targetLabel,
    personaCode: execution.personaCode,
    status: execution.status as ProviderWorkflowExecutionContract['status'],
    jobId: execution.jobId,
    inputPayload: (asRecord(execution.inputPayload) ?? {}) as Record<string, unknown>,
    resultPayload: (asRecord(execution.resultPayload) ?? null) as Record<string, unknown> | null,
    audit: {
      initiationAction:
        typeof auditMetadata?.initiationAction === 'string'
          ? auditMetadata.initiationAction
          : PROVIDER_WORKFLOW_INITIATION_ACTION,
      dispositionAction:
        typeof auditMetadata?.dispositionAction === 'string'
          ? auditMetadata.dispositionAction
          : null
    },
    createdAt: execution.createdAt.toISOString(),
    updatedAt: execution.updatedAt.toISOString(),
    completedAt: execution.completedAt?.toISOString() ?? null
  };
}

async function updateProviderWorkflowExecution(
  executionId: string,
  data: Prisma.ProviderWorkflowExecutionUpdateManyMutationInput
) {
  await prisma.providerWorkflowExecution.updateMany({
    where: {
      id: executionId
    },
    data
  });

  const execution = await prisma.providerWorkflowExecution.findFirst({
    where: {
      id: executionId
    }
  });

  if (!execution) {
    throw new Error('Provider workflow execution not found.');
  }

  return execution;
}

export async function createProviderWorkflowExecution(input: {
  tenantId: string;
  organizationUnitId?: string | null;
  initiatedByUserId?: string | null;
  personaCode?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  request: ProviderWorkflowActionRequest;
}) {
  const targetId = normalizeRequired(input.request.targetId, 'targetId');
  const workflowType = buildWorkflowType(input.request.actionType);

  const createdExecution = await prisma.$transaction(async (tx) => {
    const execution = await tx.providerWorkflowExecution.create({
      data: {
        tenantId: input.tenantId,
        organizationUnitId: input.organizationUnitId ?? null,
        initiatedByUserId: input.initiatedByUserId ?? null,
        capabilityId: normalizeRequired(input.request.capabilityId, 'capabilityId'),
        widgetId: input.request.widgetId?.trim() || null,
        workflowType,
        actionType: input.request.actionType,
        targetType: input.request.targetType,
        targetId,
        targetLabel: input.request.targetLabel?.trim() || null,
        personaCode: input.personaCode?.trim() || null,
        status: PROVIDER_WORKFLOW_PENDING_STATUS,
        inputPayload: {
          ...(input.request.payload ?? {}),
          reason: input.request.reason?.trim() || null
        },
        auditMetadata: {
          initiationAction: PROVIDER_WORKFLOW_INITIATION_ACTION,
          dispositionAction: null,
          futureApprovalEligible: true,
          futureAutomationEligible: true
        }
      }
    });

    const job = await enqueueJob(
      {
        type: 'provider.workflow.execute',
        tenantId: input.tenantId,
        payload: {
          workflowExecutionId: execution.id,
          initiatedByUserId: input.initiatedByUserId ?? null,
          personaCode: input.personaCode?.trim() || null,
          organizationUnitId: input.organizationUnitId ?? null,
          actionType: input.request.actionType,
          targetType: input.request.targetType,
          targetId,
          capabilityId: input.request.capabilityId,
          widgetId: input.request.widgetId?.trim() || null
        }
      },
      tx
    );

    await tx.providerWorkflowExecution.updateMany({
      where: {
        id: execution.id
      },
      data: {
        jobId: job.id
      }
    });

    const hydratedExecution = await tx.providerWorkflowExecution.findFirst({
      where: {
        id: execution.id
      }
    });

    if (!hydratedExecution) {
      throw new Error('Provider workflow execution not found.');
    }

    return hydratedExecution;
  });

  await logAuditEvent({
    capabilityId: createdExecution.capabilityId,
    tenantId: input.tenantId,
    actorUserId: input.initiatedByUserId ?? null,
    action: PROVIDER_WORKFLOW_INITIATION_ACTION,
    entityType: 'provider_workflow_execution',
    entityId: createdExecution.id,
    orgUnitId: input.organizationUnitId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      workflowType: createdExecution.workflowType,
      actionType: createdExecution.actionType,
      targetType: createdExecution.targetType,
      targetId: createdExecution.targetId,
      targetLabel: createdExecution.targetLabel,
      personaCode: createdExecution.personaCode,
      status: createdExecution.status,
      widgetId: createdExecution.widgetId,
      inputPayload: createdExecution.inputPayload
    }
  });

  publishInBackground('workflow.started', {
    capabilityId: createdExecution.capabilityId,
    id: randomUUID(),
    correlationId: randomUUID(),
    failureType: 'none',
    orgUnitId: input.organizationUnitId ?? null,
    tenantId: input.tenantId,
    timestamp: new Date(),
    type: 'workflow.started',
    payload: {
      workflowId: createdExecution.id,
      workflowType: createdExecution.workflowType,
      initiatedByUserId: input.initiatedByUserId ?? null,
      input: {
        targetType: createdExecution.targetType,
        targetId: createdExecution.targetId,
        actionType: createdExecution.actionType
      }
    }
  });

  return mapProviderWorkflowExecution(createdExecution);
}

export async function getProviderWorkflowExecutionById(
  tenantId: string,
  executionId: string
) {
  const execution = await prisma.providerWorkflowExecution.findFirst({
    where: {
      id: executionId,
      tenantId
    }
  });

  return execution ? mapProviderWorkflowExecution(execution) : null;
}

export async function executeProviderWorkflow(input: { workflowExecutionId: string }) {
  const execution = await prisma.providerWorkflowExecution.findFirst({
    where: {
      id: input.workflowExecutionId
    }
  });

  if (!execution) {
    throw new Error('Provider workflow execution not found.');
  }

  await prisma.providerWorkflowExecution.updateMany({
    where: {
      id: execution.id,
      status: PROVIDER_WORKFLOW_PENDING_STATUS
    },
    data: {
      status: PROVIDER_WORKFLOW_IN_PROGRESS_STATUS
    }
  });

  try {
    const resultPayload = {
      disposition: 'accepted',
      approvalState: 'not_required',
      automationState: 'ready',
      summary: buildWorkflowResultSummary({
        actionType: execution.actionType as ProviderWorkflowActionRequest['actionType'],
        targetType: execution.targetType as ProviderWorkflowActionRequest['targetType'],
        targetLabel: execution.targetLabel
      })
    } satisfies Prisma.InputJsonObject;

    const updatedExecution = await updateProviderWorkflowExecution(execution.id, {
        status: PROVIDER_WORKFLOW_SUCCEEDED_STATUS,
        resultPayload,
        completedAt: new Date(),
        auditMetadata: {
          ...(asRecord(execution.auditMetadata) ?? {}),
          initiationAction: PROVIDER_WORKFLOW_INITIATION_ACTION,
          dispositionAction: PROVIDER_WORKFLOW_SUCCEEDED_ACTION
        }
    });

    await logAuditEvent({
      capabilityId: updatedExecution.capabilityId,
      tenantId: updatedExecution.tenantId,
      actorUserId: updatedExecution.initiatedByUserId,
      action: PROVIDER_WORKFLOW_SUCCEEDED_ACTION,
      entityType: 'provider_workflow_execution',
      entityId: updatedExecution.id,
      orgUnitId: updatedExecution.organizationUnitId,
      metadata: {
        workflowType: updatedExecution.workflowType,
        actionType: updatedExecution.actionType,
        targetType: updatedExecution.targetType,
        targetId: updatedExecution.targetId,
        status: updatedExecution.status,
        resultPayload
      }
    });

    publishInBackground('workflow.completed', {
      capabilityId: updatedExecution.capabilityId,
      id: randomUUID(),
      correlationId: randomUUID(),
      failureType: 'none',
      orgUnitId: updatedExecution.organizationUnitId,
      tenantId: updatedExecution.tenantId,
      timestamp: new Date(),
      type: 'workflow.completed',
      payload: {
        workflowId: updatedExecution.id,
        workflowType: updatedExecution.workflowType,
        status: 'SUCCEEDED',
        completedByUserId: updatedExecution.initiatedByUserId,
        result: resultPayload
      }
    });

    return mapProviderWorkflowExecution(updatedExecution);
  } catch (error) {
    const failureMessage =
      error instanceof Error ? error.message : 'Unknown provider workflow error.';

    const failedExecution = await updateProviderWorkflowExecution(execution.id, {
        status: PROVIDER_WORKFLOW_FAILED_STATUS,
        resultPayload: {
          error: failureMessage
        },
        completedAt: new Date(),
        auditMetadata: {
          ...(asRecord(execution.auditMetadata) ?? {}),
          initiationAction: PROVIDER_WORKFLOW_INITIATION_ACTION,
          dispositionAction: PROVIDER_WORKFLOW_FAILED_ACTION
        }
    });

    await logAuditEvent({
      capabilityId: failedExecution.capabilityId,
      tenantId: failedExecution.tenantId,
      actorUserId: failedExecution.initiatedByUserId,
      action: PROVIDER_WORKFLOW_FAILED_ACTION,
      entityType: 'provider_workflow_execution',
      entityId: failedExecution.id,
      orgUnitId: failedExecution.organizationUnitId,
      failureType: 'job',
      metadata: {
        workflowType: failedExecution.workflowType,
        actionType: failedExecution.actionType,
        targetType: failedExecution.targetType,
        targetId: failedExecution.targetId,
        status: failedExecution.status,
        error: failureMessage
      }
    });

    publishInBackground('workflow.completed', {
      capabilityId: failedExecution.capabilityId,
      id: randomUUID(),
      correlationId: randomUUID(),
      failureType: 'job',
      orgUnitId: failedExecution.organizationUnitId,
      tenantId: failedExecution.tenantId,
      timestamp: new Date(),
      type: 'workflow.completed',
      payload: {
        workflowId: failedExecution.id,
        workflowType: failedExecution.workflowType,
        status: 'FAILED',
        completedByUserId: failedExecution.initiatedByUserId,
        result: {
          error: failureMessage
        }
      }
    });

    throw error;
  }
}
