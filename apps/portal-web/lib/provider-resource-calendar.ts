import type { ProviderOperationsUtilizationRecord } from '@payer-portal/api-contracts';

export type ResourceCalendarSlotStatus = 'booked' | 'open' | 'blocked';

export type ResourceCalendarSlot = {
  label: string;
  status: ResourceCalendarSlotStatus;
  detail: string;
  appointmentTitle?: string | null;
};

export type ResourceCalendarDay = {
  dateKey: string;
  dayLabel: string;
  shortDate: string;
  slots: ResourceCalendarSlot[];
};

export type ResourceCalendarWeek = {
  label: string;
  days: ResourceCalendarDay[];
};

export type ResourceCalendarOverrideRecord = {
  slotDate: string;
  slotLabel: string;
  status: string;
  detail?: string | null;
  appointmentTitle?: string | null;
};

export type ResourceCalendarMoveRequest = {
  sourceDate: string;
  sourceLabel: string;
  targetDate: string;
  targetLabel: string;
};

export const RESOURCE_CALENDAR_SLOT_LABELS = [
  '8a-10a',
  '10a-12p',
  '12p-2p',
  '2p-4p',
  '4p-6p',
  '6p-8p'
] as const;

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + delta);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function hashValue(input: string) {
  return [...input].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
}

function buildDefaultSlot(
  row: ProviderOperationsUtilizationRecord,
  status: ResourceCalendarSlotStatus,
  label: string
): ResourceCalendarSlot {
  if (status === 'booked') {
    return {
      label,
      status,
      detail: 'Booked',
      appointmentTitle: `${row.therapistName} session`
    };
  }

  if (status === 'blocked') {
    return {
      label,
      status,
      detail: 'Unavailable',
      appointmentTitle: 'Blocked'
    };
  }

  return {
    label,
    status,
    detail: 'Open',
    appointmentTitle: 'Open'
  };
}

export function buildResourceCalendarWeeks(
  row: ProviderOperationsUtilizationRecord
): ResourceCalendarWeek[] {
  const weekStart = startOfWeek(new Date());
  const baseHash = hashValue(row.id);
  const highUtilization = row.utilizationPercent > 95;
  const healthyUtilization = row.utilizationPercent >= 75 && row.utilizationPercent <= 95;
  const watchUtilization = row.utilizationPercent >= 50 && row.utilizationPercent < 75;
  const moderateUtilization = row.utilizationPercent >= 30 && row.utilizationPercent < 50;

  return Array.from({ length: 4 }, (_, weekIndex) => {
    const currentWeekStart = new Date(weekStart);
    currentWeekStart.setDate(weekStart.getDate() + weekIndex * 7);

    const days = Array.from({ length: 5 }, (_, dayIndex) => {
      const currentDay = new Date(currentWeekStart);
      currentDay.setDate(currentWeekStart.getDate() + dayIndex);
      const daySeed = baseHash + weekIndex * 17 + dayIndex * 31;
      const bookedCount = highUtilization
        ? 5
        : healthyUtilization
          ? 4
          : watchUtilization
            ? 3
            : moderateUtilization
              ? 2
              : 1;
      const blockedIndexes = new Set<number>();

      if (daySeed % 7 === 0) {
        blockedIndexes.add((daySeed + 1) % RESOURCE_CALENDAR_SLOT_LABELS.length);
      }

      if (watchUtilization && dayIndex === 4) {
        blockedIndexes.add(RESOURCE_CALENDAR_SLOT_LABELS.length - 1);
      }

      if (!highUtilization && daySeed % 9 === 0) {
        blockedIndexes.add((daySeed + 3) % RESOURCE_CALENDAR_SLOT_LABELS.length);
      }

      const slots = RESOURCE_CALENDAR_SLOT_LABELS.map((label, slotIndex) => {
        const slotSeed = daySeed + slotIndex * 13;
        let status: ResourceCalendarSlotStatus = 'open';

        if (blockedIndexes.has(slotIndex) || (!highUtilization && slotSeed % 17 === 0)) {
          status = 'blocked';
        } else if (slotIndex < bookedCount || (highUtilization && slotSeed % 3 !== 0)) {
          status = 'booked';
        }

        return buildDefaultSlot(row, status, label);
      });

      return {
        dateKey: currentDay.toISOString().slice(0, 10),
        dayLabel: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDay),
        shortDate: formatShortDate(currentDay),
        slots
      } satisfies ResourceCalendarDay;
    });

    const endOfWeek = new Date(currentWeekStart);
    endOfWeek.setDate(currentWeekStart.getDate() + 4);

    return {
      label: `${formatShortDate(currentWeekStart)} - ${formatShortDate(endOfWeek)}`,
      days
    } satisfies ResourceCalendarWeek;
  });
}

function normalizeStatus(value: string): ResourceCalendarSlotStatus {
  if (value === 'booked' || value === 'open' || value === 'blocked') {
    return value;
  }

  return 'open';
}

export function mergeProviderResourceCalendarOverrides(
  weeks: ResourceCalendarWeek[],
  overrides: ResourceCalendarOverrideRecord[]
): ResourceCalendarWeek[] {
  const overrideMap = new Map(
    overrides.map((entry) => [`${entry.slotDate}:${entry.slotLabel}`, entry] as const)
  );

  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      slots: day.slots.map((slot) => {
        const override = overrideMap.get(`${day.dateKey}:${slot.label}`);

        if (!override) {
          return slot;
        }

        return {
          ...slot,
          status: normalizeStatus(override.status),
          detail: override.detail?.trim() || slot.detail,
          appointmentTitle: override.appointmentTitle ?? slot.appointmentTitle ?? null
        };
      })
    }))
  }));
}

export function findResourceCalendarSlot(
  weeks: ResourceCalendarWeek[],
  dateKey: string,
  slotLabel: string
) {
  for (const week of weeks) {
    for (const day of week.days) {
      if (day.dateKey !== dateKey) {
        continue;
      }

      const slot = day.slots.find((entry) => entry.label === slotLabel);

      if (slot) {
        return {
          week,
          day,
          slot
        };
      }
    }
  }

  return null;
}

export function moveBookedResourceCalendarSlot(
  weeks: ResourceCalendarWeek[],
  move: ResourceCalendarMoveRequest
): ResourceCalendarWeek[] {
  const source = findResourceCalendarSlot(weeks, move.sourceDate, move.sourceLabel);
  const target = findResourceCalendarSlot(weeks, move.targetDate, move.targetLabel);

  if (!source || !target) {
    return weeks;
  }

  if (source.slot.status !== 'booked' || target.slot.status !== 'open') {
    return weeks;
  }

  const movedDetail = source.slot.detail;
  const movedTitle = source.slot.appointmentTitle;

  return weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      slots: day.slots.map((slot) => {
        if (day.dateKey === move.sourceDate && slot.label === move.sourceLabel) {
          return {
            ...slot,
            status: 'open',
            detail: 'Open',
            appointmentTitle: 'Open'
          };
        }

        if (day.dateKey === move.targetDate && slot.label === move.targetLabel) {
          return {
            ...slot,
            status: 'booked',
            detail: movedDetail,
            appointmentTitle: movedTitle
          };
        }

        return slot;
      })
    }))
  }));
}

export function getResourceCalendarDateRange(weeks: ResourceCalendarWeek[]) {
  const dates = weeks.flatMap((week) => week.days.map((day) => day.dateKey)).sort();

  return {
    startDate: dates[0] ?? null,
    endDate: dates[dates.length - 1] ?? null
  };
}
