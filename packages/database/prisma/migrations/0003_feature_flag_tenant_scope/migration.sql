-- DropIndex
DROP INDEX "FeatureFlag_key_key";

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_tenantId_key" ON "FeatureFlag"("key", "tenantId");
