ALTER TABLE "OrganizationUnit"
  ADD COLUMN IF NOT EXISTS "metadata" JSONB;
