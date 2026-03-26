CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'UserLifecycleStatus'
  ) THEN
    CREATE TYPE "UserLifecycleStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TenantTypeDefinition" (
  "code" TEXT NOT NULL,
  "enumValue" "TenantType" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantTypeDefinition_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantTypeDefinition_enumValue_key"
  ON "TenantTypeDefinition"("enumValue");

INSERT INTO "TenantTypeDefinition" ("code", "enumValue", "name", "description")
VALUES
  ('PAYER', 'PAYER', 'Payer', 'Insurance carrier and payer administration tenant.'),
  ('PROVIDER', 'PROVIDER', 'Provider', 'Provider organization tenant with isolated practice operations.'),
  ('EMPLOYER', 'EMPLOYER', 'Employer', 'Employer tenant for billing, enrollment, and workforce administration.'),
  ('BROKER', 'BROKER', 'Broker', 'Broker tenant for agency and client portfolio operations.'),
  ('MEMBER', 'MEMBER', 'Member', 'Member-centric tenant type reserved for future direct member organizations.')
ON CONFLICT ("code") DO UPDATE
SET
  "enumValue" = EXCLUDED."enumValue",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = CURRENT_TIMESTAMP;

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "tenantTypeCode" TEXT;

UPDATE "Tenant"
SET "tenantTypeCode" = COALESCE("tenantTypeCode", "type"::TEXT, 'PAYER')
WHERE "tenantTypeCode" IS NULL;

ALTER TABLE "Tenant"
  ALTER COLUMN "tenantTypeCode" SET DEFAULT 'PAYER';

ALTER TABLE "Tenant"
  ALTER COLUMN "tenantTypeCode" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Tenant_tenantTypeCode_fkey'
  ) THEN
    ALTER TABLE "Tenant"
      ADD CONSTRAINT "Tenant_tenantTypeCode_fkey"
      FOREIGN KEY ("tenantTypeCode")
      REFERENCES "TenantTypeDefinition"("code")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Tenant_tenantTypeCode_idx"
  ON "Tenant"("tenantTypeCode");

ALTER TABLE "Role"
  ADD COLUMN IF NOT EXISTS "tenantTypeCode" TEXT,
  ADD COLUMN IF NOT EXISTS "appliesToAllTenantTypes" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isPlatformRole" BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Role_tenantTypeCode_fkey'
  ) THEN
    ALTER TABLE "Role"
      ADD CONSTRAINT "Role_tenantTypeCode_fkey"
      FOREIGN KEY ("tenantTypeCode")
      REFERENCES "TenantTypeDefinition"("code")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Role_tenantTypeCode_idx"
  ON "Role"("tenantTypeCode");

UPDATE "Role"
SET
  "isPlatformRole" = CASE
    WHEN "code" IN ('platform_admin', 'platform-admin') THEN TRUE
    ELSE "isPlatformRole"
  END,
  "appliesToAllTenantTypes" = CASE
    WHEN "code" = 'tenant_admin' THEN TRUE
    ELSE "appliesToAllTenantTypes"
  END,
  "tenantTypeCode" = CASE
    WHEN "code" IN ('member', 'internal_operations', 'internal_admin') THEN 'PAYER'
    WHEN "code" = 'employer_group_admin' THEN 'EMPLOYER'
    WHEN "code" = 'broker' THEN 'BROKER'
    WHEN "code" IN (
      'provider',
      'clinic_manager',
      'authorization_specialist',
      'billing_specialist',
      'eligibility_coordinator',
      'provider_support'
    ) THEN 'PROVIDER'
    ELSE "tenantTypeCode"
  END;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "status" "UserLifecycleStatus";

UPDATE "User"
SET "status" = CASE
  WHEN "isActive" = TRUE THEN 'ACTIVE'::"UserLifecycleStatus"
  ELSE 'DISABLED'::"UserLifecycleStatus"
END
WHERE "status" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"UserLifecycleStatus";

ALTER TABLE "User"
  ALTER COLUMN "status" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "UserCredential" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "mustResetPassword" BOOLEAN NOT NULL DEFAULT FALSE,
  "passwordSetAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserCredential_userId_key"
  ON "UserCredential"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserCredential_userId_fkey'
  ) THEN
    ALTER TABLE "UserCredential"
      ADD CONSTRAINT "UserCredential_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "User"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "UserTenantMembership"
  ADD COLUMN IF NOT EXISTS "organizationUnitId" UUID,
  ADD COLUMN IF NOT EXISTS "status" "UserLifecycleStatus",
  ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "activatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);

UPDATE "UserTenantMembership" AS membership
SET
  "status" = CASE
    WHEN "User"."isActive" = TRUE THEN 'ACTIVE'::"UserLifecycleStatus"
    ELSE 'DISABLED'::"UserLifecycleStatus"
  END,
  "activatedAt" = CASE
    WHEN "User"."isActive" = TRUE AND membership."activatedAt" IS NULL THEN CURRENT_TIMESTAMP
    ELSE membership."activatedAt"
  END,
  "disabledAt" = CASE
    WHEN "User"."isActive" = FALSE AND membership."disabledAt" IS NULL THEN CURRENT_TIMESTAMP
    ELSE membership."disabledAt"
  END
FROM "User"
WHERE membership."userId" = "User"."id"
  AND membership."status" IS NULL;

ALTER TABLE "UserTenantMembership"
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"UserLifecycleStatus";

ALTER TABLE "UserTenantMembership"
  ALTER COLUMN "status" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "UserTenantMembership_organizationUnitId_idx"
  ON "UserTenantMembership"("organizationUnitId");

CREATE INDEX IF NOT EXISTS "UserTenantMembership_status_idx"
  ON "UserTenantMembership"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserTenantMembership_organizationUnitId_tenantId_fkey'
  ) THEN
    ALTER TABLE "UserTenantMembership"
      ADD CONSTRAINT "UserTenantMembership_organizationUnitId_tenantId_fkey"
      FOREIGN KEY ("organizationUnitId", "tenantId")
      REFERENCES "OrganizationUnit"("id", "tenantId")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "UserRole"
  ADD COLUMN IF NOT EXISTS "id" UUID,
  ADD COLUMN IF NOT EXISTS "tenantId" UUID;

UPDATE "UserRole" AS assignment
SET
  "id" = COALESCE(assignment."id", gen_random_uuid()),
  "tenantId" = COALESCE(assignment."tenantId", "User"."tenantId")
FROM "User"
WHERE assignment."userId" = "User"."id";

ALTER TABLE "UserRole"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

UPDATE "UserRole"
SET "id" = gen_random_uuid()
WHERE "id" IS NULL;

ALTER TABLE "UserRole"
  ALTER COLUMN "id" SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserRole_pkey'
  ) THEN
    ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_pkey";
  END IF;
END $$;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX IF NOT EXISTS "UserRole_userId_roleId_tenantId_key"
  ON "UserRole"("userId", "roleId", "tenantId");

CREATE INDEX IF NOT EXISTS "UserRole_tenantId_idx"
  ON "UserRole"("tenantId");

CREATE INDEX IF NOT EXISTS "UserRole_roleId_tenantId_idx"
  ON "UserRole"("roleId", "tenantId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserRole_tenantId_fkey'
  ) THEN
    ALTER TABLE "UserRole"
      ADD CONSTRAINT "UserRole_tenantId_fkey"
      FOREIGN KEY ("tenantId")
      REFERENCES "Tenant"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
