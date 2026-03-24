ALTER TYPE "ApiCatalogCategory" ADD VALUE IF NOT EXISTS 'CLINICAL';
ALTER TYPE "ApiCatalogCategory" ADD VALUE IF NOT EXISTS 'AUTHORIZATION';

ALTER TABLE "api_catalog_entries"
ADD COLUMN "vendor" TEXT NOT NULL DEFAULT 'Payer Platform',
ADD COLUMN "inputModels" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "outputModels" JSONB NOT NULL DEFAULT '[]';

UPDATE "api_catalog_entries"
SET
  "vendor" = 'Payer Platform',
  "inputModels" = CASE "slug"
    WHEN 'claims-adjudication' THEN '["ClaimSearchRequest","ClaimStatusRequest"]'::jsonb
    WHEN 'pharmacy-benefits' THEN '["PharmacyBenefitRequest","FormularyLookupRequest"]'::jsonb
    WHEN 'eligibility-verification' THEN '["EligibilityRequest","CoverageWindowRequest"]'::jsonb
    ELSE '[]'::jsonb
  END,
  "outputModels" = CASE "slug"
    WHEN 'claims-adjudication' THEN '["ClaimAdjudicationResponse","RemittanceSummary"]'::jsonb
    WHEN 'pharmacy-benefits' THEN '["PharmacyBenefitResponse","PriorAuthorizationSummary"]'::jsonb
    WHEN 'eligibility-verification' THEN '["EligibilityResponse","AccumulatorSummary"]'::jsonb
    ELSE '[]'::jsonb
  END;
