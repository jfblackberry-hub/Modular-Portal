CREATE TABLE "PortalAuthHandoff" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "audience" TEXT NOT NULL,
  "redirectPath" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "userSnapshot" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PortalAuthHandoff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PortalAuthHandoff_tenantId_createdAt_idx"
ON "PortalAuthHandoff"("tenantId", "createdAt");

CREATE INDEX "PortalAuthHandoff_userId_createdAt_idx"
ON "PortalAuthHandoff"("userId", "createdAt");

CREATE INDEX "PortalAuthHandoff_audience_expiresAt_idx"
ON "PortalAuthHandoff"("audience", "expiresAt");

CREATE INDEX "PortalAuthHandoff_consumedAt_expiresAt_idx"
ON "PortalAuthHandoff"("consumedAt", "expiresAt");

ALTER TABLE "PortalAuthHandoff"
ADD CONSTRAINT "PortalAuthHandoff_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PortalAuthHandoff"
ADD CONSTRAINT "PortalAuthHandoff_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
