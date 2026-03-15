import type { Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import { subscribe } from '../events/eventBus.js';
import {
  type PlatformEvent,
  PLATFORM_EVENT_TYPES
} from '../events/eventTypes.js';
import { enqueueJob } from '../jobs/jobQueue.js';
import { INTEGRATION_TRIGGER_MODE } from './integration.js';

let subscriptionsRegistered = false;
const unsubscribeHandlers: Array<() => void> = [];

function toConfigRecord(value: Prisma.JsonValue): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getTrigger(config: Prisma.JsonValue) {
  const record = toConfigRecord(config);
  const trigger = record?.trigger;

  if (typeof trigger !== 'object' || trigger === null || Array.isArray(trigger)) {
    return null;
  }

  return trigger as Record<string, unknown>;
}

function normalizeEventTypes(trigger: Record<string, unknown> | null) {
  if (!Array.isArray(trigger?.event_types)) {
    return typeof trigger?.eventName === 'string' && trigger.eventName.trim()
      ? [trigger.eventName]
      : [];
  }

  return trigger.event_types.filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
}

function resolveWebhookRetryAttempts(config: Prisma.JsonValue) {
  const record = toConfigRecord(config);
  const retryPolicy =
    record && typeof record.retry_policy === 'object' && record.retry_policy !== null
      ? (record.retry_policy as Record<string, unknown>)
      : null;

  if (
    retryPolicy &&
    typeof retryPolicy.max_attempts === 'number' &&
    retryPolicy.max_attempts > 0
  ) {
    return Math.floor(retryPolicy.max_attempts);
  }

  return undefined;
}

async function enqueueEventTriggeredIntegrations(event: PlatformEvent) {
  const connectors = await prisma.connectorConfig.findMany({
    where: {
      tenantId: event.tenantId ?? undefined,
      status: 'ACTIVE'
    }
  });

  for (const connector of connectors) {
    const trigger = getTrigger(connector.config as Prisma.JsonValue);
    const eventTypes = normalizeEventTypes(trigger);

    if (
      trigger?.mode !== INTEGRATION_TRIGGER_MODE.EVENT ||
      (eventTypes.length > 0 && !eventTypes.includes(event.type))
    ) {
      continue;
    }

    await enqueueJob({
      type: 'connector.sync',
      tenantId: connector.tenantId,
      payload: {
        connectorId: connector.id,
        connectorType: connector.adapterKey,
        event: {
          correlationId: event.correlationId,
          id: event.id,
          payload: event.payload as Prisma.InputJsonValue,
          tenantId: event.tenantId,
          timestamp: event.timestamp.toISOString(),
          type: event.type
        },
        triggerEvent: event.type,
        triggerMode: INTEGRATION_TRIGGER_MODE.EVENT
      },
      maxAttempts:
        connector.adapterKey === 'webhook'
          ? resolveWebhookRetryAttempts(connector.config as Prisma.JsonValue)
          : undefined
    });
  }
}

export async function enqueueScheduledIntegrations(now = new Date()) {
  const connectors = await prisma.connectorConfig.findMany({
    where: {
      status: 'ACTIVE'
    }
  });

  let scheduledCount = 0;

  for (const connector of connectors) {
    const trigger = getTrigger(connector.config as Prisma.JsonValue);

    if (trigger?.mode !== INTEGRATION_TRIGGER_MODE.SCHEDULED) {
      continue;
    }

    if (typeof trigger.schedule !== 'string' || !trigger.schedule.trim()) {
      continue;
    }

    await enqueueJob({
      type: 'connector.sync',
      tenantId: connector.tenantId,
      payload: {
        connectorId: connector.id,
        connectorType: connector.adapterKey,
        triggerMode: INTEGRATION_TRIGGER_MODE.SCHEDULED
      },
      runAt: now
    });
    scheduledCount += 1;
  }

  return scheduledCount;
}

export function registerIntegrationEventSubscriptions() {
  if (subscriptionsRegistered) {
    return;
  }

  subscriptionsRegistered = true;

  for (const eventType of PLATFORM_EVENT_TYPES) {
    const unsubscribe = subscribe(
      eventType,
      async (event) => {
        await enqueueEventTriggeredIntegrations(event);
      },
      {
        subscriberId: `integrations.${eventType}.trigger`
      }
    );

    unsubscribeHandlers.push(unsubscribe);
  }
}

export function clearIntegrationEventSubscriptions() {
  for (const unsubscribe of unsubscribeHandlers.splice(0)) {
    unsubscribe();
  }

  subscriptionsRegistered = false;
}
