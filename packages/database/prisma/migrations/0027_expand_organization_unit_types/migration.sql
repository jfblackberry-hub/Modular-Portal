DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'OrganizationUnitType'
  ) THEN
    ALTER TYPE "OrganizationUnitType" ADD VALUE IF NOT EXISTS 'ENTERPRISE';
    ALTER TYPE "OrganizationUnitType" ADD VALUE IF NOT EXISTS 'REGION';
  END IF;
END
$$;
