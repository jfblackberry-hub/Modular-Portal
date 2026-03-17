ALTER TABLE "User"
ADD COLUMN "employerGroupId" UUID;

CREATE TABLE "EmployerGroup" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "employerKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "logoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "brandingConfig" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmployerGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmployerGroup_tenantId_employerKey_key"
ON "EmployerGroup"("tenantId", "employerKey");

CREATE INDEX "EmployerGroup_tenantId_isActive_idx"
ON "EmployerGroup"("tenantId", "isActive");

CREATE INDEX "User_employerGroupId_idx"
ON "User"("employerGroupId");

ALTER TABLE "EmployerGroup"
ADD CONSTRAINT "EmployerGroup_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_employerGroupId_fkey"
FOREIGN KEY ("employerGroupId") REFERENCES "EmployerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
