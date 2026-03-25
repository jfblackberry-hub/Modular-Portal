import { randomUUID } from 'node:crypto';

export type ObservabilityFailureType =
  | 'none'
  | 'authentication'
  | 'authorization'
  | 'document'
  | 'integration'
  | 'job'
  | 'notification'
  | 'validation'
  | 'workflow'
  | 'system'
  | 'unknown';

export type ObservabilityContextInput = {
  capabilityId?: string | null;
  correlationId?: string | null;
  failureType?: string | null;
  orgUnitId?: string | null;
  tenantId?: string | null;
};

export type ObservabilityContext = {
  capabilityId: string;
  correlationId: string;
  failureType: string;
  orgUnitId?: string;
  tenantId: string;
};

function normalizeRequired(value: string | null | undefined, fieldName: string) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function resolveObservabilityCorrelationId(value?: string | null) {
  return normalizeOptional(value) ?? randomUUID();
}

export function validateObservabilityContext(
  input: ObservabilityContextInput
): ObservabilityContext {
  return {
    capabilityId: normalizeRequired(input.capabilityId, 'capabilityId'),
    correlationId: resolveObservabilityCorrelationId(input.correlationId),
    failureType: normalizeRequired(input.failureType, 'failureType'),
    ...(normalizeOptional(input.orgUnitId)
      ? { orgUnitId: normalizeOptional(input.orgUnitId) }
      : {}),
    tenantId: normalizeRequired(input.tenantId, 'tenantId')
  };
}

export function mergeObservabilityContext(
  base: ObservabilityContextInput,
  override?: ObservabilityContextInput
) {
  return validateObservabilityContext({
    capabilityId: override?.capabilityId ?? base.capabilityId,
    correlationId: override?.correlationId ?? base.correlationId,
    failureType: override?.failureType ?? base.failureType,
    orgUnitId: override?.orgUnitId ?? base.orgUnitId,
    tenantId: override?.tenantId ?? base.tenantId
  });
}
