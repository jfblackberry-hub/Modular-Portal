ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "templateId" UUID;

CREATE TABLE IF NOT EXISTS "TenantTemplate" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tenantTypeCode" TEXT NOT NULL,
  "description" TEXT,
  "defaultOrganizationUnitStructure" JSONB NOT NULL DEFAULT '[]',
  "defaultCapabilities" JSONB NOT NULL DEFAULT '[]',
  "defaultExperiences" JSONB NOT NULL DEFAULT '[]',
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantTemplate_code_key" ON "TenantTemplate"("code");
CREATE INDEX IF NOT EXISTS "TenantTemplate_tenantTypeCode_idx" ON "TenantTemplate"("tenantTypeCode");

CREATE TABLE IF NOT EXISTS "CapabilityRegistryEntry" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "configSchema" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CapabilityRegistryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TenantExperience" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "tenantTypeCode" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "scope" TEXT NOT NULL DEFAULT 'tenant',
  "layout" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantExperience_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantExperience_tenantId_key_key" ON "TenantExperience"("tenantId", "key");
CREATE INDEX IF NOT EXISTS "TenantExperience_tenantId_idx" ON "TenantExperience"("tenantId");
CREATE INDEX IF NOT EXISTS "TenantExperience_tenantTypeCode_idx" ON "TenantExperience"("tenantTypeCode");

CREATE TABLE IF NOT EXISTS "TenantCapabilityConfig" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "tenantTypeCode" TEXT NOT NULL,
  "experienceId" UUID NOT NULL,
  "capabilityId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "scope" TEXT NOT NULL DEFAULT 'tenant',
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "config" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantCapabilityConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TenantCapabilityConfig_tenantId_experienceId_capabilityId_key"
  ON "TenantCapabilityConfig"("tenantId", "experienceId", "capabilityId");
CREATE INDEX IF NOT EXISTS "TenantCapabilityConfig_tenantId_idx" ON "TenantCapabilityConfig"("tenantId");
CREATE INDEX IF NOT EXISTS "TenantCapabilityConfig_tenantTypeCode_idx" ON "TenantCapabilityConfig"("tenantTypeCode");
CREATE INDEX IF NOT EXISTS "TenantCapabilityConfig_capabilityId_idx" ON "TenantCapabilityConfig"("capabilityId");

ALTER TABLE "Tenant"
  ADD CONSTRAINT "Tenant_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "TenantTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TenantTemplate"
  ADD CONSTRAINT "TenantTemplate_tenantTypeCode_fkey"
  FOREIGN KEY ("tenantTypeCode") REFERENCES "TenantTypeDefinition"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantExperience"
  ADD CONSTRAINT "TenantExperience_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantExperience"
  ADD CONSTRAINT "TenantExperience_tenantTypeCode_fkey"
  FOREIGN KEY ("tenantTypeCode") REFERENCES "TenantTypeDefinition"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantCapabilityConfig"
  ADD CONSTRAINT "TenantCapabilityConfig_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantCapabilityConfig"
  ADD CONSTRAINT "TenantCapabilityConfig_tenantTypeCode_fkey"
  FOREIGN KEY ("tenantTypeCode") REFERENCES "TenantTypeDefinition"("code")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TenantCapabilityConfig"
  ADD CONSTRAINT "TenantCapabilityConfig_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "TenantExperience"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TenantCapabilityConfig"
  ADD CONSTRAINT "TenantCapabilityConfig_capabilityId_fkey"
  FOREIGN KEY ("capabilityId") REFERENCES "CapabilityRegistryEntry"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
