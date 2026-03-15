CREATE TABLE "IntegrationExecution" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "connectorConfigId" UUID NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "triggerMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "recordsProcessed" INTEGER,
    "eventsPublished" INTEGER,
    "message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "IntegrationExecution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IntegrationExecution_tenantId_startedAt_idx" ON "IntegrationExecution"("tenantId", "startedAt");
CREATE INDEX "IntegrationExecution_connectorConfigId_startedAt_idx" ON "IntegrationExecution"("connectorConfigId", "startedAt");
CREATE INDEX "IntegrationExecution_status_idx" ON "IntegrationExecution"("status");

ALTER TABLE "IntegrationExecution"
ADD CONSTRAINT "IntegrationExecution_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationExecution"
ADD CONSTRAINT "IntegrationExecution_connectorConfigId_fkey"
FOREIGN KEY ("connectorConfigId") REFERENCES "ConnectorConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
