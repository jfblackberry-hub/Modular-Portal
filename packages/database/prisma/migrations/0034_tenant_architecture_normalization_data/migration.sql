INSERT INTO "TenantTypeDefinition" ("code", "enumValue", "name", "description")
VALUES
  ('CLINIC', 'CLINIC', 'Clinic', 'Clinic tenant with provider-class isolation and shared operational structure.'),
  ('PHYSICIAN_GROUP', 'PHYSICIAN_GROUP', 'Physician Group', 'Physician Group tenant sharing the provider-class internal structure.'),
  ('HOSPITAL', 'HOSPITAL', 'Hospital', 'Hospital tenant sharing the provider-class internal structure.'),
  ('PROVIDER', 'PROVIDER', 'Provider (Legacy)', 'Deprecated legacy tenant type normalized to Clinic during architectural correction.')
ON CONFLICT ("code") DO UPDATE
SET
  "enumValue" = EXCLUDED."enumValue",
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updatedAt" = NOW();

UPDATE "Tenant"
SET
  "type" = 'CLINIC',
  "tenantTypeCode" = 'CLINIC',
  "updatedAt" = NOW()
WHERE "type" = 'PROVIDER'
   OR "tenantTypeCode" = 'PROVIDER';
