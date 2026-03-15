-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'ONBOARDING', 'INACTIVE');

-- AlterTable
ALTER TABLE "Tenant"
ADD COLUMN "brandingConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN "status" "TenantStatus" NOT NULL DEFAULT 'ONBOARDING';
