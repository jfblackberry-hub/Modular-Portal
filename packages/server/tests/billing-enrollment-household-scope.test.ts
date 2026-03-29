import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  deriveBillingEnrollmentHouseholdId,
  HouseholdScopeError,
  resolveAuthorizedHouseholdId
} from '../src/modules/billingEnrollment/householdScope.js';

test('deriveBillingEnrollmentHouseholdId is stable per tenant and user', () => {
  const tenantId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const userId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const a = deriveBillingEnrollmentHouseholdId(tenantId, userId);
  const b = deriveBillingEnrollmentHouseholdId(tenantId, userId);
  assert.equal(a, b);
  assert.match(a, /^hh-[a-f0-9]{32}$/);
});

test('deriveBillingEnrollmentHouseholdId differs across tenants for same user', () => {
  const userId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const a = deriveBillingEnrollmentHouseholdId(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId
  );
  const b = deriveBillingEnrollmentHouseholdId(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    userId
  );
  assert.notEqual(a, b);
});

test('resolveAuthorizedHouseholdId rejects missing household id', () => {
  assert.throws(
    () =>
      resolveAuthorizedHouseholdId(
        { tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', actorUserId: 'u1' },
        ''
      ),
    HouseholdScopeError
  );
});

test('resolveAuthorizedHouseholdId rejects foreign household id', () => {
  const tenantId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const actorUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const expected = deriveBillingEnrollmentHouseholdId(tenantId, actorUserId);
  assert.throws(
    () =>
      resolveAuthorizedHouseholdId(
        { tenantId, actorUserId },
        `${expected.slice(0, -1)}0`
      ),
    (error: unknown) =>
      error instanceof HouseholdScopeError && error.statusCode === 403
  );
});

test('resolveAuthorizedHouseholdId accepts matching household id', () => {
  const tenantId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const actorUserId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const expected = deriveBillingEnrollmentHouseholdId(tenantId, actorUserId);
  const resolved = resolveAuthorizedHouseholdId(
    { tenantId, actorUserId },
    expected
  );
  assert.equal(resolved, expected);
});
