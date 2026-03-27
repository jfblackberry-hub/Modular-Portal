import 'server-only';

import type { ProviderOperationsUtilizationRecord } from '@payer-portal/api-contracts';
import { prisma, runWithTenantContext } from '@payer-portal/database';

import type { PortalSessionUser } from './portal-session';
import type {
  ResourceCalendarMoveRequest,
  ResourceCalendarOverrideRecord
} from './provider-resource-calendar';
import {
  buildResourceCalendarWeeks,
  findResourceCalendarSlot,
  getResourceCalendarDateRange,
  mergeProviderResourceCalendarOverrides
} from './provider-resource-calendar';

function toDateOnlyValue(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function asUuidOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
    ? value
    : null;
}

async function listProviderResourceCalendarOverrides(input: {
  tenantId: string;
  resourceId: string;
  startDate: string;
  endDate: string;
}) {
  return runWithTenantContext({ tenantId: input.tenantId, source: 'token' }, async () =>
    prisma.providerResourceCalendarSlot.findMany({
      where: {
        resourceId: input.resourceId,
        slotDate: {
          gte: toDateOnlyValue(input.startDate),
          lte: toDateOnlyValue(input.endDate)
        }
      },
      orderBy: [{ slotDate: 'asc' }, { slotLabel: 'asc' }]
    })
  );
}

async function upsertProviderResourceCalendarSlot(input: {
  tenantId: string;
  organizationUnitId: string | null;
  resourceId: string;
  resourceName: string;
  slotDate: string;
  slotLabel: string;
  status: 'booked' | 'open' | 'blocked';
  detail: string;
  appointmentTitle?: string | null;
}) {
  return runWithTenantContext({ tenantId: input.tenantId, source: 'token' }, async () =>
    prisma.providerResourceCalendarSlot.upsert({
      where: {
        tenantId_resourceId_slotDate_slotLabel: {
          tenantId: input.tenantId,
          resourceId: input.resourceId,
          slotDate: toDateOnlyValue(input.slotDate),
          slotLabel: input.slotLabel
        }
      },
      create: {
        tenantId: input.tenantId,
        organizationUnitId: input.organizationUnitId,
        resourceId: input.resourceId,
        resourceName: input.resourceName,
        slotDate: toDateOnlyValue(input.slotDate),
        slotLabel: input.slotLabel,
        status: input.status,
        detail: input.detail,
        appointmentTitle: input.appointmentTitle ?? null
      },
      update: {
        organizationUnitId: input.organizationUnitId,
        resourceName: input.resourceName,
        status: input.status,
        detail: input.detail,
        appointmentTitle: input.appointmentTitle ?? null
      }
    })
  );
}

function mapOverridesToContract(
  rows: Awaited<ReturnType<typeof listProviderResourceCalendarOverrides>>
): ResourceCalendarOverrideRecord[] {
  return rows.map((row) => ({
    slotDate: row.slotDate.toISOString().slice(0, 10),
    slotLabel: row.slotLabel,
    status: row.status,
    detail: row.detail,
    appointmentTitle: row.appointmentTitle
  }));
}

export async function getProviderResourceCalendarWeeks(input: {
  user: PortalSessionUser;
  resource: ProviderOperationsUtilizationRecord;
}) {
  const baselineWeeks = buildResourceCalendarWeeks(input.resource);
  const { startDate, endDate } = getResourceCalendarDateRange(baselineWeeks);

  if (!startDate || !endDate) {
    return baselineWeeks;
  }

  const overrides = await listProviderResourceCalendarOverrides({
    tenantId: input.user.tenant.id,
    resourceId: input.resource.id,
    startDate,
    endDate
  });

  return mergeProviderResourceCalendarOverrides(
    baselineWeeks,
    mapOverridesToContract(overrides)
  );
}

export async function moveProviderResourceCalendarBooking(input: {
  user: PortalSessionUser;
  resource: ProviderOperationsUtilizationRecord;
  move: ResourceCalendarMoveRequest;
}) {
  const currentWeeks = await getProviderResourceCalendarWeeks({
    user: input.user,
    resource: input.resource
  });

  const source = findResourceCalendarSlot(
    currentWeeks,
    input.move.sourceDate,
    input.move.sourceLabel
  );
  const target = findResourceCalendarSlot(
    currentWeeks,
    input.move.targetDate,
    input.move.targetLabel
  );

  if (!source || !target) {
    throw new Error('Unable to locate the selected calendar slots.');
  }

  if (source.slot.status !== 'booked') {
    throw new Error('Only booked sessions can be moved.');
  }

  if (target.slot.status !== 'open') {
    throw new Error('Booked sessions can only be moved into open availability.');
  }

  await upsertProviderResourceCalendarSlot({
    tenantId: input.user.tenant.id,
    organizationUnitId: asUuidOrNull(
      input.user.session.activeOrganizationUnit?.id ?? input.resource.organizationUnitId
    ),
    resourceId: input.resource.id,
    resourceName: input.resource.therapistName,
    slotDate: input.move.sourceDate,
    slotLabel: input.move.sourceLabel,
    status: 'open',
    detail: 'Open',
    appointmentTitle: 'Open'
  });

  await upsertProviderResourceCalendarSlot({
    tenantId: input.user.tenant.id,
    organizationUnitId: asUuidOrNull(
      input.user.session.activeOrganizationUnit?.id ?? input.resource.organizationUnitId
    ),
    resourceId: input.resource.id,
    resourceName: input.resource.therapistName,
    slotDate: input.move.targetDate,
    slotLabel: input.move.targetLabel,
    status: 'booked',
    detail: source.slot.detail,
    appointmentTitle: source.slot.appointmentTitle ?? `${input.resource.therapistName} session`
  });

  return getProviderResourceCalendarWeeks({
    user: input.user,
    resource: input.resource
  });
}
