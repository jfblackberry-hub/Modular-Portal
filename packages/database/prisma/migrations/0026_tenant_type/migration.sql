DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TenantType'
  ) THEN
    CREATE TYPE "TenantType" AS ENUM (
      'PAYER',
      'EMPLOYER',
      'BROKER',
      'MEMBER',
      'PROVIDER'
    );
  END IF;
END $$;

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "type" "TenantType";

UPDATE "Tenant"
SET "type" = COALESCE("type", 'PAYER'::"TenantType")
WHERE "type" IS NULL;

ALTER TABLE "Tenant"
  ALTER COLUMN "type" SET DEFAULT 'PAYER'::"TenantType";

ALTER TABLE "Tenant"
  ALTER COLUMN "type" SET NOT NULL;
