CREATE TABLE "EventRecord" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "tenantId" UUID,
    "correlationId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventDelivery" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "deadLetteredAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventRecord_type_occurredAt_idx" ON "EventRecord"("type", "occurredAt");
CREATE INDEX "EventRecord_tenantId_occurredAt_idx" ON "EventRecord"("tenantId", "occurredAt");
CREATE INDEX "EventRecord_correlationId_idx" ON "EventRecord"("correlationId");

CREATE UNIQUE INDEX "EventDelivery_eventId_subscriberId_key" ON "EventDelivery"("eventId", "subscriberId");
CREATE INDEX "EventDelivery_status_nextAttemptAt_idx" ON "EventDelivery"("status", "nextAttemptAt");
CREATE INDEX "EventDelivery_subscriberId_createdAt_idx" ON "EventDelivery"("subscriberId", "createdAt");

ALTER TABLE "EventRecord"
ADD CONSTRAINT "EventRecord_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventDelivery"
ADD CONSTRAINT "EventDelivery_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "EventRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
