CREATE TABLE "ProviderWorkflowExecution" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationUnitId" UUID,
  "initiatedByUserId" UUID,
  "capabilityId" TEXT NOT NULL,
  "widgetId" TEXT,
  "workflowType" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "targetLabel" TEXT,
  "personaCode" TEXT,
  "status" TEXT NOT NULL,
  "jobId" UUID,
  "inputPayload" JSONB NOT NULL,
  "resultPayload" JSONB,
  "auditMetadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "ProviderWorkflowExecution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProviderWorkflowExecution_tenantId_createdAt_idx"
  ON "ProviderWorkflowExecution"("tenantId", "createdAt");
CREATE INDEX "ProviderWorkflowExecution_tenantId_status_createdAt_idx"
  ON "ProviderWorkflowExecution"("tenantId", "status", "createdAt");
CREATE INDEX "ProviderWorkflowExecution_tenantId_organizationUnitId_createdAt_idx"
  ON "ProviderWorkflowExecution"("tenantId", "organizationUnitId", "createdAt");
CREATE INDEX "ProviderWorkflowExecution_initiatedByUserId_createdAt_idx"
  ON "ProviderWorkflowExecution"("initiatedByUserId", "createdAt");
CREATE INDEX "ProviderWorkflowExecution_jobId_idx"
  ON "ProviderWorkflowExecution"("jobId");

ALTER TABLE "ProviderWorkflowExecution"
  ADD CONSTRAINT "ProviderWorkflowExecution_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderWorkflowExecution"
  ADD CONSTRAINT "ProviderWorkflowExecution_organizationUnitId_tenantId_fkey"
  FOREIGN KEY ("organizationUnitId", "tenantId") REFERENCES "OrganizationUnit"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProviderWorkflowExecution"
  ADD CONSTRAINT "ProviderWorkflowExecution_initiatedByUserId_fkey"
  FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
