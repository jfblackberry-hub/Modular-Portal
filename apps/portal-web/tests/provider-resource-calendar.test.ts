import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ProviderOperationsUtilizationRecord } from '@payer-portal/api-contracts';

import {
  RESOURCE_CALENDAR_SLOT_LABELS,
  buildResourceCalendarWeeks,
  mergeProviderResourceCalendarOverrides,
  moveBookedResourceCalendarSlot
} from '../lib/provider-resource-calendar';

const baseResource: ProviderOperationsUtilizationRecord = {
  id: 'util-1',
  organizationUnitId: 'ou-1',
  organizationUnitName: 'Grand Rapids Clinic',
  therapistName: 'Avery Collins',
  roleLabel: 'Therapist',
  utilizationPercent: 88,
  scheduledSessions: 7,
  weeklyCapacity: 8,
  openCoverageGaps: 0,
  atRiskSessions: 0,
  tone: 'info',
  nextAction: 'Keep clinic coverage steady.'
};

test('resource calendar builds 2-hour slots from 8a to 8p', () => {
  assert.deepEqual(RESOURCE_CALENDAR_SLOT_LABELS, [
    '8a-10a',
    '10a-12p',
    '12p-2p',
    '2p-4p',
    '4p-6p',
    '6p-8p'
  ]);

  const baseline = buildResourceCalendarWeeks(baseResource);
  assert.equal(baseline[0]!.days[0]!.slots.length, 6);
});

test('provider resource calendar overrides replace baseline slot state', () => {
  const baseline = buildResourceCalendarWeeks(baseResource);
  const targetDay = baseline[0]!.days[0]!;
  const targetSlot = targetDay.slots[0]!;

  const merged = mergeProviderResourceCalendarOverrides(baseline, [
    {
      slotDate: targetDay.dateKey,
      slotLabel: targetSlot.label,
      status: 'blocked',
      detail: 'Unavailable',
      appointmentTitle: 'Blocked'
    }
  ]);

  assert.equal(merged[0]!.days[0]!.slots[0]!.status, 'blocked');
  assert.equal(merged[0]!.days[0]!.slots[0]!.appointmentTitle, 'Blocked');
});

test('moving a booked slot to an open slot updates both cells', () => {
  const baseline = buildResourceCalendarWeeks(baseResource);
  const allDays = baseline.flatMap((week) => week.days);
  const sourceDay = allDays.find((day) => day.slots.some((slot) => slot.status === 'booked'));
  const targetDay = allDays.find((day) => day.slots.some((slot) => slot.status === 'open'));
  const sourceSlot = sourceDay?.slots.find((slot) => slot.status === 'booked');
  const targetSlot = targetDay?.slots.find((slot) => slot.status === 'open');

  assert.ok(sourceDay);
  assert.ok(targetDay);
  assert.ok(sourceSlot);
  assert.ok(targetSlot);

  const moved = moveBookedResourceCalendarSlot(baseline, {
    sourceDate: sourceDay.dateKey,
    sourceLabel: sourceSlot.label,
    targetDate: targetDay.dateKey,
    targetLabel: targetSlot.label
  });

  const movedSource = moved
    .flatMap((week) => week.days)
    .find((day) => day.dateKey === sourceDay.dateKey)!
    .slots.find((slot) => slot.label === sourceSlot.label)!;
  const movedTarget = moved
    .flatMap((week) => week.days)
    .find((day) => day.dateKey === targetDay.dateKey)!
    .slots.find((slot) => slot.label === targetSlot.label)!;

  assert.equal(movedSource.status, 'open');
  assert.equal(movedTarget.status, 'booked');
});
