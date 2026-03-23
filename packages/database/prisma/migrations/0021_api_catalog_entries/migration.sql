CREATE TYPE "ApiCatalogCategory" AS ENUM ('CLAIMS', 'PHARMACY', 'ELIGIBILITY');

CREATE TABLE "api_catalog_entries" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ApiCatalogCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "tenantAvailability" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_catalog_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_catalog_entries_slug_key" ON "api_catalog_entries"("slug");
CREATE INDEX "api_catalog_entries_category_sortOrder_name_idx"
ON "api_catalog_entries"("category", "sortOrder", "name");

INSERT INTO "api_catalog_entries" (
    "id",
    "slug",
    "name",
    "category",
    "description",
    "endpoint",
    "version",
    "tenantAvailability",
    "sortOrder"
) VALUES
(
    '31d313ec-3a5a-47b1-a44b-a1817f6dfa01',
    'claims-adjudication',
    'Claims Adjudication API',
    'CLAIMS',
    'Search claim status, adjudication history, and remittance outcomes across payer workflows.',
    '/claims/v1/adjudications',
    'v1',
    '["*"]'::jsonb,
    10
),
(
    '31d313ec-3a5a-47b1-a44b-a1817f6dfa02',
    'pharmacy-benefits',
    'Pharmacy Benefits API',
    'PHARMACY',
    'Retrieve formulary, benefit, and prior authorization context for pharmacy transactions.',
    '/pharmacy/v1/benefits',
    'v2',
    '["*"]'::jsonb,
    20
),
(
    '31d313ec-3a5a-47b1-a44b-a1817f6dfa03',
    'eligibility-verification',
    'Eligibility Verification API',
    'ELIGIBILITY',
    'Validate member coverage, accumulators, and eligibility windows before service delivery.',
    '/eligibility/v1/verifications',
    'v1',
    '["*"]'::jsonb,
    30
);
