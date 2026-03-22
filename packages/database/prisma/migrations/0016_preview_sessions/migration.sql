CREATE TYPE "PreviewSessionMode" AS ENUM ('READ_ONLY', 'FUNCTIONAL');

CREATE TABLE "PreviewSession" (
  "id" UUID NOT NULL,
  "adminUserId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "targetUserId" UUID NOT NULL,
  "subTenantId" TEXT,
  "portalType" TEXT NOT NULL,
  "persona" TEXT NOT NULL,
  "mode" "PreviewSessionMode" NOT NULL,
  "launchToken" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "lastAccessedAt" TIMESTAMP(3),

  CONSTRAINT "PreviewSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreviewSession_launchToken_key"
ON "PreviewSession"("launchToken");

CREATE INDEX "PreviewSession_adminUserId_endedAt_createdAt_idx"
ON "PreviewSession"("adminUserId", "endedAt", "createdAt");

CREATE INDEX "PreviewSession_tenantId_endedAt_idx"
ON "PreviewSession"("tenantId", "endedAt");

CREATE INDEX "PreviewSession_targetUserId_endedAt_idx"
ON "PreviewSession"("targetUserId", "endedAt");

CREATE INDEX "PreviewSession_expiresAt_idx"
ON "PreviewSession"("expiresAt");

ALTER TABLE "PreviewSession"
ADD CONSTRAINT "PreviewSession_adminUserId_fkey"
FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PreviewSession"
ADD CONSTRAINT "PreviewSession_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PreviewSession"
ADD CONSTRAINT "PreviewSession_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
