ALTER TABLE "AuditLog"
ADD COLUMN "beforeState" JSONB,
ADD COLUMN "afterState" JSONB;

CREATE INDEX "AuditLog_tenantId_action_createdAt_idx"
ON "AuditLog"("tenantId", "action", "createdAt");

CREATE INDEX "AuditLog_actorUserId_createdAt_idx"
ON "AuditLog"("actorUserId", "createdAt");
