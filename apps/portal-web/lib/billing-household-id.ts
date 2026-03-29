import { createHash } from 'node:crypto';

/**
 * Must remain aligned with `deriveBillingEnrollmentHouseholdId` in
 * `packages/server/src/modules/billingEnrollment/householdScope.ts`.
 */
export function deriveBillingEnrollmentHouseholdId(tenantId: string, actorUserId: string): string {
  const t = tenantId?.trim();
  const u = actorUserId?.trim();
  if (!t || !u) {
    throw new Error('Authenticated tenant and user are required to scope household access.');
  }
  const digest = createHash('sha256').update(`${t}:${u}`, 'utf8').digest('hex');
  return `hh-${digest.slice(0, 32)}`;
}
