-- CreateTable
CREATE TABLE "ConnectorConfig" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "adapterKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "lastHealthCheckAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectorConfig_tenantId_idx" ON "ConnectorConfig"("tenantId");

-- CreateIndex
CREATE INDEX "ConnectorConfig_adapterKey_idx" ON "ConnectorConfig"("adapterKey");

-- CreateIndex
CREATE INDEX "ConnectorConfig_status_idx" ON "ConnectorConfig"("status");

-- AddForeignKey
ALTER TABLE "ConnectorConfig" ADD CONSTRAINT "ConnectorConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
