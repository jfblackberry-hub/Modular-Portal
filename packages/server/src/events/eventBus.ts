import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';

import type { EventDelivery, EventRecord, Prisma } from '@payer-portal/database';
import { prisma } from '@payer-portal/database';

import type { PlatformEvent, PlatformEventType } from './eventTypes.js';
import { enqueueJob } from '../jobs/jobQueue.js';
import type { QueuedPlatformEvent } from '../jobs/jobTypes.js';
import { createStructuredLogger } from '../observability/logger.js';
import { validateObservabilityContext } from '../observability/schema.js';

type EventByType = {
  [T in PlatformEventType]: Extract<PlatformEvent, { type: T }>;
};

export type EventHandler<TEvent extends PlatformEvent = PlatformEvent> = (
  event: TEvent
) => Promise<void> | void;

export const EVENT_DELIVERY_STATUS = {
  DEAD_LETTER: 'DEAD_LETTER',
  DELIVERED: 'DELIVERED',
  PENDING: 'PENDING',
  RUNNING: 'RUNNING'
} as const;

type RegisteredSubscriber<TType extends PlatformEventType = PlatformEventType> = {
  eventType: TType;
  handler: EventHandler<EventByType[TType]>;
  maxAttempts: number;
  subscriberId: string;
  wrapper: (input: {
    event: EventByType[TType];
    eventRecord: EventRecord;
  }) => Promise<void>;
};

export type SubscribeOptions = {
  maxAttempts?: number;
  replay?: {
    since?: Date;
    limit?: number;
  };
  subscriberId?: string;
};

export type EventHistoryFilters = {
  correlationId?: string;
  eventType?: PlatformEventType;
  limit?: number;
  tenantId?: string;
};

export type ReplayOptions = {
  since?: Date;
  limit?: number;
};

const emitter = new EventEmitter();
const subscribers = new Map<
  PlatformEventType,
  Map<string, RegisteredSubscriber>
>();
const backgroundPublishes = new Set<Promise<void>>();

emitter.setMaxListeners(0);

const eventLogger = createStructuredLogger({
  serviceName: 'server',
  observability: {
    capabilityId: 'platform.eventing',
    failureType: 'none',
    tenantId: 'platform'
  }
});

function getSubscribers<TType extends PlatformEventType>(eventType: TType) {
  let eventSubscribers = subscribers.get(eventType);

  if (!eventSubscribers) {
    eventSubscribers = new Map();
    subscribers.set(eventType, eventSubscribers);
  }

  return eventSubscribers as unknown as Map<string, RegisteredSubscriber<TType>>;
}

function normalizeMaxAttempts(maxAttempts?: number) {
  return maxAttempts && maxAttempts > 0 ? Math.floor(maxAttempts) : 3;
}

function normalizeLimit(limit?: number) {
  if (!limit || limit <= 0) {
    return 100;
  }

  return Math.min(Math.floor(limit), 500);
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 1000);
  }

  return 'Unknown event handler error';
}

function hydrateSerializedEvent(
  payload: Prisma.JsonObject | QueuedPlatformEvent,
  fallbackTimestamp: Date
): PlatformEvent {
  const timestampValue = payload.timestamp;
  const event = {
    ...(payload as unknown as Omit<PlatformEvent, 'timestamp'>),
    timestamp:
      typeof timestampValue === 'string' || timestampValue instanceof Date
        ? new Date(timestampValue)
        : fallbackTimestamp
  } as PlatformEvent;

  if (event.type === 'notification.sent') {
    return {
      ...event,
      payload: {
        ...event.payload,
        sentAt: new Date(event.payload.sentAt)
      }
    };
  }

  if (event.type === 'integration.completed') {
    return {
      ...event,
      payload: {
        ...event.payload,
        completedAt: new Date(event.payload.completedAt)
      }
    };
  }

  return event;
}

function hydrateEvent(record: EventRecord): PlatformEvent {
  return hydrateSerializedEvent(record.payload as Prisma.JsonObject, record.occurredAt);
}

function serializeEvent<TType extends PlatformEventType>(
  eventType: TType,
  event: EventByType[TType]
): EventByType[TType] {
  const observability = validateObservabilityContext({
    capabilityId: event.capabilityId,
    correlationId: event.correlationId,
    failureType: event.failureType,
    orgUnitId: event.orgUnitId ?? null,
    tenantId: event.tenantId
  });

  return {
    ...event,
    ...observability,
    id: event.id?.trim() || randomUUID(),
    type: eventType,
    timestamp: event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)
  };
}

export function queuePlatformEvent<TType extends PlatformEventType>(
  eventType: TType,
  event: EventByType[TType]
): QueuedPlatformEvent {
  const serializedEvent = serializeEvent(eventType, event);

  return {
    capabilityId: serializedEvent.capabilityId,
    correlationId: serializedEvent.correlationId,
    failureType: serializedEvent.failureType,
    id: serializedEvent.id,
    orgUnitId: serializedEvent.orgUnitId ?? null,
    payload: serializedEvent.payload as Prisma.JsonValue,
    tenantId: serializedEvent.tenantId,
    timestamp: serializedEvent.timestamp.toISOString(),
    type: serializedEvent.type
  };
}

export function hydrateQueuedPlatformEvent(event: QueuedPlatformEvent): PlatformEvent {
  return hydrateSerializedEvent(
    event as unknown as Prisma.JsonObject,
    new Date(event.timestamp)
  );
}

async function ensureDelivery(
  eventId: string,
  subscriberId: string,
  maxAttempts: number
) {
  return prisma.eventDelivery.upsert({
    where: {
      eventId_subscriberId: {
        eventId,
        subscriberId
      }
    },
    update: {},
    create: {
      eventId,
      subscriberId,
      status: EVENT_DELIVERY_STATUS.PENDING,
      maxAttempts
    }
  });
}

async function claimDelivery(deliveryId: string) {
  const updatedAt = new Date();
  const result = await prisma.eventDelivery.updateMany({
    where: {
      id: deliveryId,
      status: EVENT_DELIVERY_STATUS.PENDING,
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: updatedAt } }]
    },
    data: {
      status: EVENT_DELIVERY_STATUS.RUNNING,
      updatedAt
    }
  });

  if (result.count === 0) {
    return null;
  }

  return prisma.eventDelivery.findUnique({
    where: {
      id: deliveryId
    }
  });
}

async function markDeliveryDelivered(deliveryId: string, attempts: number) {
  return prisma.eventDelivery.update({
    where: { id: deliveryId },
    data: {
      attempts,
      deliveredAt: new Date(),
      deadLetteredAt: null,
      lastError: null,
      nextAttemptAt: null,
      status: EVENT_DELIVERY_STATUS.DELIVERED
    }
  });
}

async function markDeliveryFailed(
  delivery: Pick<EventDelivery, 'id' | 'attempts' | 'maxAttempts'>,
  error: unknown
) {
  const attempts = delivery.attempts + 1;
  const shouldRetry = attempts < delivery.maxAttempts;

  return prisma.eventDelivery.update({
    where: { id: delivery.id },
    data: {
      attempts,
      deadLetteredAt: shouldRetry ? null : new Date(),
      lastError: normalizeError(error),
      nextAttemptAt: shouldRetry ? new Date(Date.now() + attempts * 60_000) : null,
      status: shouldRetry
        ? EVENT_DELIVERY_STATUS.PENDING
        : EVENT_DELIVERY_STATUS.DEAD_LETTER
    }
  });
}

async function attemptSubscriberDelivery<TType extends PlatformEventType>(
  subscriber: RegisteredSubscriber<TType>,
  event: EventByType[TType],
  eventRecord: EventRecord
) {
  const delivery = await ensureDelivery(
    eventRecord.id,
    subscriber.subscriberId,
    subscriber.maxAttempts
  );

  if (
    delivery.status === EVENT_DELIVERY_STATUS.DELIVERED ||
    delivery.status === EVENT_DELIVERY_STATUS.DEAD_LETTER
  ) {
    return delivery;
  }

  const claimedDelivery = await claimDelivery(delivery.id);

  if (!claimedDelivery) {
    return delivery;
  }

  try {
    await subscriber.handler(event);
    return await markDeliveryDelivered(
      claimedDelivery.id,
      claimedDelivery.attempts + 1
    );
  } catch (error) {
    return markDeliveryFailed(claimedDelivery, error);
  }
}

export function subscribe<TType extends PlatformEventType>(
  eventType: TType,
  handler: EventHandler<EventByType[TType]>,
  options: SubscribeOptions = {}
) {
  const eventSubscribers = getSubscribers(eventType);
  const subscriberId =
    options.subscriberId?.trim() || `${eventType}:${randomUUID()}`;
  const existingSubscriber = eventSubscribers.get(subscriberId);

  if (existingSubscriber) {
    emitter.off(eventType, existingSubscriber.wrapper);
  }

  const subscriber: RegisteredSubscriber<TType> = {
    eventType,
    handler,
    maxAttempts: normalizeMaxAttempts(options.maxAttempts),
    subscriberId,
    wrapper: async ({ event, eventRecord }) => {
      await attemptSubscriberDelivery(subscriber, event, eventRecord);
    }
  };

  eventSubscribers.set(subscriberId, subscriber);
  emitter.on(eventType, subscriber.wrapper);

  if (options.replay) {
    queueMicrotask(() => {
      void replayEvents(eventType, subscriberId, options.replay);
    });
  }

  return () => {
    const currentSubscriber = getSubscribers(eventType).get(subscriberId);

    if (!currentSubscriber) {
      return;
    }

    emitter.off(eventType, currentSubscriber.wrapper);
    getSubscribers(eventType).delete(subscriberId);
  };
}

export async function publish<TType extends PlatformEventType>(
  eventType: TType,
  event: EventByType[TType]
) {
  const serializedEvent = serializeEvent(eventType, event);
  const eventRecord = await prisma.eventRecord.create({
    data: {
      id: randomUUID(),
      type: serializedEvent.type,
      tenantId: serializedEvent.tenantId,
      correlationId: serializedEvent.correlationId,
      payload: serializedEvent as unknown as Prisma.InputJsonValue,
      occurredAt: serializedEvent.timestamp
    }
  });

  const eventSubscribers = Array.from(getSubscribers(eventType).values());

  if (eventSubscribers.length > 0) {
    await prisma.eventDelivery.createMany({
      data: eventSubscribers.map((subscriber) => ({
        eventId: eventRecord.id,
        subscriberId: subscriber.subscriberId,
        status: EVENT_DELIVERY_STATUS.PENDING,
        maxAttempts: subscriber.maxAttempts
      })),
      skipDuplicates: true
    });
  }

  const listeners = emitter.listeners(eventType) as Array<
    RegisteredSubscriber<TType>['wrapper']
  >;

  await Promise.all(
    listeners.map((listener) =>
      listener({
        event: serializedEvent,
        eventRecord
      })
    )
  );

  return serializedEvent;
}

export function publishInBackground<TType extends PlatformEventType>(
  eventType: TType,
  event: EventByType[TType]
) {
  const pendingPublish = enqueueJob({
    type: 'event.publish',
    tenantId: event.tenantId,
    payload: {
      event: queuePlatformEvent(eventType, event)
    }
  })
      .then(() => undefined)
      .catch((error) => {
        eventLogger.error('background event publish failed', {
          capabilityId: event.capabilityId,
          correlationId: event.correlationId,
          eventType,
          failureType: event.failureType === 'none' ? 'system' : event.failureType,
          orgUnitId: event.orgUnitId ?? undefined,
          tenantId: event.tenantId,
          errorMessage: error instanceof Error ? error.message : String(error)
        });
        throw error;
      });

  backgroundPublishes.add(pendingPublish);
  void pendingPublish.finally(() => {
    backgroundPublishes.delete(pendingPublish);
  });
}

export async function waitForBackgroundPublishes() {
  while (backgroundPublishes.size > 0) {
    await Promise.allSettled(Array.from(backgroundPublishes));
  }
}

export async function processPendingEventDeliveries(limit?: number) {
  const pendingDeliveries = await prisma.eventDelivery.findMany({
    where: {
      status: EVENT_DELIVERY_STATUS.PENDING,
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }]
    },
    include: {
      event: true
    },
    orderBy: [{ createdAt: 'asc' }],
    take: normalizeLimit(limit)
  });

  for (const delivery of pendingDeliveries) {
    const eventType = delivery.event.type as PlatformEventType;
    const subscriber = getSubscribers(eventType).get(delivery.subscriberId);

    if (!subscriber) {
      continue;
    }

    await attemptSubscriberDelivery(
      subscriber,
      hydrateEvent(delivery.event) as never,
      delivery.event
    );
  }

  return pendingDeliveries.length;
}

export async function getEventHistory(filters: EventHistoryFilters = {}) {
  const events = await prisma.eventRecord.findMany({
    where: {
      correlationId: filters.correlationId,
      tenantId: filters.tenantId,
      type: filters.eventType
    },
    orderBy: [{ occurredAt: 'desc' }],
    take: normalizeLimit(filters.limit)
  });

  return events.map(hydrateEvent);
}

export async function replayEvents<TType extends PlatformEventType>(
  eventType: TType,
  subscriberId: string,
  options: ReplayOptions = {}
) {
  const subscriber = getSubscribers(eventType).get(subscriberId);

  if (!subscriber) {
    throw new Error(`No subscriber registered for ${eventType}:${subscriberId}`);
  }

  const records = await prisma.eventRecord.findMany({
    where: {
      type: eventType,
      occurredAt: options.since ? { gte: options.since } : undefined
    },
    orderBy: [{ occurredAt: 'asc' }],
    take: normalizeLimit(options.limit)
  });

  for (const record of records) {
    await attemptSubscriberDelivery(
      subscriber,
      hydrateEvent(record) as EventByType[TType],
      record
    );
  }

  return records.length;
}

export async function getDeadLetterQueue(filters: {
  eventType?: PlatformEventType;
  subscriberId?: string;
} = {}) {
  return prisma.eventDelivery.findMany({
    where: {
      status: EVENT_DELIVERY_STATUS.DEAD_LETTER,
      subscriberId: filters.subscriberId,
      event: {
        type: filters.eventType
      }
    },
    include: {
      event: true
    },
    orderBy: [{ updatedAt: 'desc' }]
  });
}

export function clearSubscriptions() {
  for (const [eventType, eventSubscribers] of subscribers.entries()) {
    for (const subscriber of eventSubscribers.values()) {
      emitter.off(eventType, subscriber.wrapper);
    }
  }

  subscribers.clear();
}
