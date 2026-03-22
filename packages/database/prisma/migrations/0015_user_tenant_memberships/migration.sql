ALTER TABLE "User"
ALTER COLUMN "tenantId" DROP NOT NULL;

ALTER TABLE "User"
DROP CONSTRAINT "User_tenantId_fkey";

ALTER TABLE "User"
ADD CONSTRAINT "User_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "UserTenantMembership" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isTenantAdmin" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserTenantMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTenantMembership_userId_tenantId_key"
ON "UserTenantMembership"("userId", "tenantId");

CREATE INDEX "UserTenantMembership_tenantId_idx"
ON "UserTenantMembership"("tenantId");

CREATE INDEX "UserTenantMembership_userId_isTenantAdmin_idx"
ON "UserTenantMembership"("userId", "isTenantAdmin");

CREATE INDEX "UserTenantMembership_userId_isDefault_idx"
ON "UserTenantMembership"("userId", "isDefault");

ALTER TABLE "UserTenantMembership"
ADD CONSTRAINT "UserTenantMembership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserTenantMembership"
ADD CONSTRAINT "UserTenantMembership_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserTenantMembership" ("id", "userId", "tenantId", "isDefault", "isTenantAdmin", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  "id",
  "tenantId",
  true,
  EXISTS (
    SELECT 1
    FROM "UserRole"
    INNER JOIN "Role" ON "Role"."id" = "UserRole"."roleId"
    WHERE "UserRole"."userId" = "User"."id"
      AND "Role"."code" = 'tenant_admin'
  ),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE "tenantId" IS NOT NULL;
