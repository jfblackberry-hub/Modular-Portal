CREATE TABLE IF NOT EXISTS "UserOrganizationUnitAssignment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationUnitId" UUID NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserOrganizationUnitAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserOrganizationUnitAssignment_userId_tenantId_organizationUnitId_key"
    UNIQUE ("userId", "tenantId", "organizationUnitId")
);

CREATE INDEX IF NOT EXISTS "UserOrganizationUnitAssignment_tenantId_organizationUnitId_idx"
  ON "UserOrganizationUnitAssignment"("tenantId", "organizationUnitId");

CREATE INDEX IF NOT EXISTS "UserOrganizationUnitAssignment_userId_tenantId_isDefault_idx"
  ON "UserOrganizationUnitAssignment"("userId", "tenantId", "isDefault");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserOrganizationUnitAssignment_userId_fkey'
  ) THEN
    ALTER TABLE "UserOrganizationUnitAssignment"
      ADD CONSTRAINT "UserOrganizationUnitAssignment_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserOrganizationUnitAssignment_tenantId_fkey'
  ) THEN
    ALTER TABLE "UserOrganizationUnitAssignment"
      ADD CONSTRAINT "UserOrganizationUnitAssignment_tenantId_fkey"
      FOREIGN KEY ("tenantId")
      REFERENCES "Tenant"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserOrganizationUnitAssignment_organizationUnitId_tenantId_fkey'
  ) THEN
    ALTER TABLE "UserOrganizationUnitAssignment"
      ADD CONSTRAINT "UserOrganizationUnitAssignment_organizationUnitId_tenantId_fkey"
      FOREIGN KEY ("organizationUnitId", "tenantId")
      REFERENCES "OrganizationUnit"("id", "tenantId")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "UserOrganizationUnitAssignment" (
  "userId",
  "tenantId",
  "organizationUnitId",
  "isDefault",
  "createdAt",
  "updatedAt"
)
SELECT
  membership."userId",
  membership."tenantId",
  membership."organizationUnitId",
  TRUE,
  membership."createdAt",
  membership."updatedAt"
FROM "UserTenantMembership" AS membership
WHERE membership."organizationUnitId" IS NOT NULL
ON CONFLICT ("userId", "tenantId", "organizationUnitId") DO NOTHING;
