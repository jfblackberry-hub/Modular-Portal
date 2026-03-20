# API Catalog Architecture

## Purpose

The API Catalog is the planning and control-plane inventory for external and platform-facing integrations across the Modular Portal ecosystem. It exists to answer a few foundational questions in one place:

- Which healthcare vendors and platform APIs matter to us?
- What category of workflow do they support?
- How ready are they for implementation or tenant enablement?
- Which integrations are important for AWS migration planning?
- Which APIs should become reusable multi-tenant templates versus one-off custom projects?

The current version is intentionally scaffolded as seeded/static catalog data inside the admin console so we can move quickly without over-engineering persistence too early. The structure is designed so it can later be backed by a service, database table, or AWS-native control-plane model.

## Data Model Overview

Primary model: `ApiCatalogEntry`

Core fields include:

- `id`
- `vendorName`
- `vendorSlug`
- `platformName`
- `platformSlug`
- `apiName`
- `apiCategory`
- `apiSubcategory`
- `integrationDomain`
- `strategicPriority`
- `summary`
- `description`
- `supportedModules`
- `primaryUsers`
- `integrationPatterns`
- `authTypes`
- `dataStandards`
- `deploymentModel`
- `implementationStatus`
- `readinessLevel`
- `tenantConfigurable`
- `tenantEnablementPotential`
- `environmentSupport`
- `awsRelevance`
- `observabilitySupport`
- `documentationStatus`
- `lastReviewed`
- `relatedModules`
- `tags`
- `notes`
- `futureAwsMapping`
- `canonicalModelMapping`

Supporting enums/constants are defined for:

- API category
- implementation status
- readiness level
- strategic priority
- auth type
- data standard
- deployment model
- AWS relevance

## Category Taxonomy

The initial taxonomy supports operational filtering and future commercialization:

- Pharmacy
- Claims
- Clinical
- Eligibility
- Benefits
- Authorizations
- Prior Authorization
- Payments
- Enrollment
- Billing
- Provider
- Member
- Employer
- Broker
- Admin
- Identity
- Observability
- Documents
- Interoperability
- Analytics
- Care Management
- CRM / Engagement

This taxonomy is intentionally broad enough to support:

- platform planning
- tenant packaging
- implementation roadmaps
- future API marketplace concepts

## Implementation Status Definitions

- `Not Started`: no implementation scaffold exists yet
- `Planned`: recognized as a target and should be implemented, but no meaningful integration path is built
- `Partial`: some real integration or contract work exists, but it is not complete enough for broad tenant use
- `Implemented`: materially usable in the platform today
- `Mocked`: UI/demo or conceptual support exists, but the integration is not functionally real

## How to Add New Catalog Entries

1. Open `apps/admin-console/lib/api-catalog.seed.ts`
2. Add a new `createEntry({...})` block
3. Use the existing constants and type-safe field values where possible
4. Add meaningful:
   - category
   - priority
   - implementation status
   - AWS relevance
   - tags
   - canonical model mapping
   - future AWS mapping
5. Confirm the new entry appears correctly on:
   - `/admin/platform/connectivity/catalog`

Recommended practice:

- keep `summary` concise and operational
- keep `description` strategic and explanatory
- use tags that improve quick filtering
- assign AWS relevance honestly rather than optimistically

## UI Structure

The catalog workspace is split into modular admin components:

- `ApiCatalogPage`
- `ApiCatalogFilters`
- `ApiCatalogTable`
- `ApiCatalogDetailPanel`

Capabilities included today:

- search
- filter by category
- filter by implementation status
- filter by strategic priority
- filter by vendor
- filter by auth type
- filter by tenant configurability
- filter by AWS relevance
- quick tag filtering
- sort by vendor, category, implementation status, priority, last reviewed, and AWS relevance
- table view
- optional grid view
- persistent detail panel

## Evolution Path for AWS Migration and Tenant Enablement

This catalog can evolve in stages.

### Near-term

- link entries to real applied connector templates
- track owner/team
- capture external documentation URLs
- connect entries to tenant-ready enablement templates
- add implementation backlog references

### AWS migration phase

- map entries to target AWS services and integration patterns
- identify blocker APIs that need migration-safe observability and credential handling
- attach environment-specific deployment notes
- connect catalog entries to migration runbooks

### Longer-term

- persist catalog entries in a backend service
- support approval and lifecycle workflows
- add tenant enablement state per API
- attach implementation packages or connector templates
- surface health and deployment status directly in the catalog
- support commercialization and packaging strategy by tenant tier or product bundle

## Future Enhancement Ideas

- owner/team metadata
- documentation links and implementation guides
- live health rollups from connector telemetry
- AWS service scorecards
- tenant adoption counts
- API onboarding workflow states
- integration cost and complexity scoring
- security classification and PHI sensitivity tags
- canonical data domain coverage heatmaps

## File Structure

Current scaffold files:

- `apps/admin-console/lib/api-catalog.types.ts`
- `apps/admin-console/lib/api-catalog.constants.ts`
- `apps/admin-console/lib/api-catalog.seed.ts`
- `apps/admin-console/lib/api-catalog.utils.ts`
- `apps/admin-console/components/api-catalog/ApiCatalogPage.tsx`
- `apps/admin-console/components/api-catalog/ApiCatalogFilters.tsx`
- `apps/admin-console/components/api-catalog/ApiCatalogTable.tsx`
- `apps/admin-console/components/api-catalog/ApiCatalogDetailPanel.tsx`
- `apps/admin-console/app/admin/platform/connectivity/catalog/page.tsx`

This gives us a clean starting point that is immediately usable in the admin portal and safe to evolve into a live API management capability later.
