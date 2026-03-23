INSERT INTO "api_catalog_entries" (
  "id",
  "slug",
  "name",
  "category",
  "vendor",
  "description",
  "endpoint",
  "version",
  "inputModels",
  "outputModels",
  "tenantAvailability",
  "sortOrder"
) VALUES
(
  '31d313ec-3a5a-47b1-a44b-a1817f6dfa04',
  'clinical-data-exchange',
  'Clinical Data Exchange API',
  'CLINICAL',
  'HealthBridge Clinical',
  'Exchange encounter summaries, lab snapshots, and care events for clinical workflows and downstream analytics.',
  '/clinical/v1/exchange',
  'v1',
  '["ClinicalEventRequest","EncounterSummaryRequest"]'::jsonb,
  '["ClinicalEventResponse","CareGapSnapshot"]'::jsonb,
  '["*"]'::jsonb,
  40
),
(
  '31d313ec-3a5a-47b1-a44b-a1817f6dfa05',
  'prior-authorization-hub',
  'Prior Authorization Hub API',
  'AUTHORIZATION',
  'AuthFlow Network',
  'Coordinate prior authorization intake, decisioning, and utilization review timelines across payer and provider touchpoints.',
  '/authorizations/v1/requests',
  'v2',
  '["AuthorizationSubmission","AuthorizationStatusLookup"]'::jsonb,
  '["AuthorizationDecision","AuthorizationTimeline"]'::jsonb,
  '["*"]'::jsonb,
  50
)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "vendor" = EXCLUDED."vendor",
  "description" = EXCLUDED."description",
  "endpoint" = EXCLUDED."endpoint",
  "version" = EXCLUDED."version",
  "inputModels" = EXCLUDED."inputModels",
  "outputModels" = EXCLUDED."outputModels",
  "tenantAvailability" = EXCLUDED."tenantAvailability",
  "sortOrder" = EXCLUDED."sortOrder";
