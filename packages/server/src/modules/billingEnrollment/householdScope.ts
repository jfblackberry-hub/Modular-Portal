import { createHash } from 'node:crypto';

import type { BillingEnrollmentContext } from './types.js';

export class HouseholdScopeError extends Error {
  readonly statusCode: 400 | 403;

  constructor(message: string, statusCode: 400 | 403 = 400) {
    super(message);
    this.name = 'HouseholdScopeError';
    this.statusCode = statusCode;
  }
}

/**
 * Deterministic household identifier for the billing-enrollment mock module.
 * Must stay stable per (tenantId, actorUserId) so workspace and dependents APIs stay aligned.
 * Portal BFF must mirror this algorithm in `apps/portal-web/lib/billing-household-id.ts`.
 */
export function deriveBillingEnrollmentHouseholdId(tenantId: string, actorUserId: string): string {
  const t = tenantId?.trim();
  const u = actorUserId?.trim();
  if (!t || !u) {
    throw new HouseholdScopeError(
      'Authenticated tenant and user are required to scope household access.'
    );
  }
  const digest = createHash('sha256').update(`${t}:${u}`, 'utf8').digest('hex');
  return `hh-${digest.slice(0, 32)}`;
}

export function resolveAuthorizedHouseholdId(
  context: BillingEnrollmentContext,
  requestedHouseholdId: string | undefined | null
): string {
  const actorId = context.actorUserId?.trim();
  if (!actorId) {
    throw new HouseholdScopeError(
      'Authenticated user context is required for household operations.'
    );
  }
  const expected = deriveBillingEnrollmentHouseholdId(context.tenantId, actorId);
  const provided = requestedHouseholdId?.trim();
  if (!provided) {
    throw new HouseholdScopeError('Household context is required.');
  }
  if (provided !== expected) {
    throw new HouseholdScopeError(
      'Household is not available for the current session.',
      403
    );
  }
  return expected;
}
