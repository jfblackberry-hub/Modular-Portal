DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'OrganizationUnitType'
  ) THEN
    CREATE TYPE "OrganizationUnitType" AS ENUM (
      'LOCATION',
      'DEPARTMENT',
      'TEAM'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "OrganizationUnit" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "parentId" UUID,
  "type" "OrganizationUnitType" NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationUnit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationUnit_parent_not_self" CHECK (
    "parentId" IS NULL OR "parentId" <> "id"
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OrganizationUnit_tenantId_fkey'
  ) THEN
    ALTER TABLE "OrganizationUnit"
      ADD CONSTRAINT "OrganizationUnit_tenantId_fkey"
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
    WHERE conname = 'OrganizationUnit_id_tenantId_key'
  ) THEN
    ALTER TABLE "OrganizationUnit"
      ADD CONSTRAINT "OrganizationUnit_id_tenantId_key"
      UNIQUE ("id", "tenantId");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'OrganizationUnit_parentId_tenantId_fkey'
  ) THEN
    ALTER TABLE "OrganizationUnit"
      ADD CONSTRAINT "OrganizationUnit_parentId_tenantId_fkey"
      FOREIGN KEY ("parentId", "tenantId")
      REFERENCES "OrganizationUnit"("id", "tenantId")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "OrganizationUnit_tenantId_idx"
  ON "OrganizationUnit"("tenantId");

CREATE INDEX IF NOT EXISTS "OrganizationUnit_tenantId_type_idx"
  ON "OrganizationUnit"("tenantId", "type");

CREATE INDEX IF NOT EXISTS "OrganizationUnit_tenantId_parentId_idx"
  ON "OrganizationUnit"("tenantId", "parentId");
