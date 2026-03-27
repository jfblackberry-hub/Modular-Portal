CREATE TABLE "ProviderResourceCalendarSlot" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationUnitId" UUID,
  "resourceId" TEXT NOT NULL,
  "resourceName" TEXT NOT NULL,
  "slotDate" DATE NOT NULL,
  "slotLabel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "appointmentTitle" TEXT,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProviderResourceCalendarSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderResourceCalendarSlot_tenantId_resourceId_slotDate_slotLabel_key"
  ON "ProviderResourceCalendarSlot"("tenantId", "resourceId", "slotDate", "slotLabel");

CREATE INDEX "ProviderResourceCalendarSlot_tenantId_resourceId_slotDate_idx"
  ON "ProviderResourceCalendarSlot"("tenantId", "resourceId", "slotDate");

CREATE INDEX "ProviderResourceCalendarSlot_tenantId_organizationUnitId_slotDate_idx"
  ON "ProviderResourceCalendarSlot"("tenantId", "organizationUnitId", "slotDate");

ALTER TABLE "ProviderResourceCalendarSlot"
  ADD CONSTRAINT "ProviderResourceCalendarSlot_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderResourceCalendarSlot"
  ADD CONSTRAINT "ProviderResourceCalendarSlot_organizationUnitId_tenantId_fkey"
  FOREIGN KEY ("organizationUnitId", "tenantId") REFERENCES "OrganizationUnit"("id", "tenantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
