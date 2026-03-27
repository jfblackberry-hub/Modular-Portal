UPDATE "Role"
SET "tenantTypeCode" = 'PAYER'
WHERE "tenantTypeCode" IN ('EMPLOYER', 'BROKER', 'MEMBER');

UPDATE "Tenant"
SET "tenantTypeCode" = 'PAYER'
WHERE "tenantTypeCode" IN ('EMPLOYER', 'BROKER', 'MEMBER');

UPDATE "Tenant"
SET "type" = 'PAYER'
WHERE "type"::text IN ('EMPLOYER', 'BROKER', 'MEMBER');

DELETE FROM "TenantTypeDefinition"
WHERE "code" IN ('EMPLOYER', 'BROKER', 'MEMBER');

CREATE TYPE "TenantType_new" AS ENUM (
  'PAYER',
  'CLINIC',
  'PHYSICIAN_GROUP',
  'HOSPITAL',
  'PROVIDER'
);

ALTER TABLE "Tenant"
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "type" TYPE "TenantType_new"
  USING ("type"::text::"TenantType_new"),
  ALTER COLUMN "type" SET DEFAULT 'PAYER'::"TenantType_new";

ALTER TABLE "TenantTypeDefinition"
  ALTER COLUMN "enumValue" TYPE "TenantType_new"
  USING ("enumValue"::text::"TenantType_new");

DROP TYPE "TenantType";

ALTER TYPE "TenantType_new" RENAME TO "TenantType";
