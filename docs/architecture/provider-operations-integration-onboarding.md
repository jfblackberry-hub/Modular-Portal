# Provider Operations Integration Onboarding

## Enforced pattern

Provider Operations source onboarding must use the shared integration layer and shared connector model.

The allowed flow is:

`source system -> shared connector config -> shared integration adapter -> provider operations normalization service -> platform data layer -> widgets`

## Initial sources

- Google Cloud data warehouse
- Clearinghouse environment
- CentralReach

## Rules

- Widgets do not connect directly to any source
- Widgets do not parse source-specific payloads
- Connector onboarding remains adapter-driven and tenant-scoped
- Source-specific models are normalized before platform/UI consumption
- Organization Unit scope and roll-up policy are enforced before normalized contracts are returned

## Shared implementation points

- Source contracts: `packages/api-contracts/src/provider-operations.ts`
- Source onboarding metadata: `apps/api/src/services/api-catalog-service.ts`
- Source normalization and scoping: `apps/api/src/services/provider-operations-service.ts`
- UI/platform consumption contract: `apps/portal-web/lib/provider-operations-data.ts`

## POC note

The initial POC supports connector-backed source metadata and normalized dataset payloads stored on shared connector configs. That keeps the onboarding path reusable while avoiding any Provider-widget coupling to source formats.
