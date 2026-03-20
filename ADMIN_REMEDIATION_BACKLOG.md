# Admin Remediation Backlog

## Phase 1: AWS migration blockers

### 1. Consolidate the admin route architecture

- Problem statement: The repo currently has parallel admin route trees under `/admin`, `/platform`, `/platform-admin`, and `/tenant-admin`, which causes duplicated UX, inconsistent entry points, and migration confusion.
- Recommended implementation: Standardize on `/admin/**`, add redirects from legacy paths, remove duplicate page implementations, and document the canonical IA.
- Impacted files/modules if known: `apps/admin-console/app/admin/**`, `apps/admin-console/app/platform/**`, `apps/admin-console/app/platform-admin/**`, `apps/admin-console/app/tenant-admin/**`
- Priority: P0
- Acceptance criteria:
  - all supported admin flows resolve through `/admin/**`
  - legacy routes redirect consistently or are removed
  - no duplicated active admin pages remain

### 2. Remove or hide placeholder pages from primary admin navigation

- Problem statement: The current nav advertises incomplete workspaces as if they are operational.
- Recommended implementation: Feature-flag or temporarily remove placeholder routes from `admin-route-config.ts` until each has minimum viable functionality.
- Impacted files/modules if known: `apps/admin-console/components/admin-route-config.ts`, placeholder routes under `apps/admin-console/app/admin/**`
- Priority: P0
- Acceptance criteria:
  - primary nav contains only operable workspaces
  - unfinished areas are either hidden or clearly labeled as roadmap-only

### 3. Harden tenant provisioning into an actual onboarding workflow

- Problem statement: Tenant creation works, but it does not establish a safe end-to-end onboarding workflow for production operations.
- Recommended implementation: Add staged validation, required configuration checks, bootstrap steps, and post-create handoff into tenant readiness.
- Impacted files/modules if known: `apps/admin-console/app/tenants/create-tenant-panel.tsx`, `apps/api/src/routes/tenants.ts`, `apps/api/src/services/tenant-service.ts`
- Priority: P0
- Acceptance criteria:
  - tenant creation validates required inputs before submit
  - post-create handoff shows next required setup steps
  - duplicate/invalid provisioning states are blocked clearly

### 4. Complete the core access administration flow

- Problem statement: User and role administration exist, but they are still partial and not yet robust enough for production operations.
- Recommended implementation: Add search/filtering, confirmation flows, stronger validation, and complete role lifecycle support including edits and dependency-aware deletes.
- Impacted files/modules if known: `apps/admin-console/components/user-list-page.tsx`, `apps/admin-console/components/user-detail-drawer.tsx`, `apps/admin-console/app/roles/role-management.tsx`, `apps/api/src/routes/roles.ts`, `apps/api/src/services/role-service.ts`
- Priority: P0
- Acceptance criteria:
  - platform and tenant admins can safely manage users and roles without hidden side effects
  - dangerous actions require confirmation
  - role lifecycle is more than create/assign/remove

### 5. Replace placeholder identity and security controls with minimum viable implementations

- Problem statement: Identity, SSO, permissions, and session-management pages are exposed but not real.
- Recommended implementation: Either implement minimum viable read-only status views backed by real data or remove them from nav until post-migration.
- Impacted files/modules if known: `apps/admin-console/app/admin/platform/connectivity/identity/page.tsx`, `apps/admin-console/app/admin/platform/security/permissions/page.tsx`, `apps/admin-console/app/admin/platform/security/sessions/page.tsx`, `apps/admin-console/app/admin/tenant/connectivity/sso/page.tsx`, `apps/admin-console/app/admin/tenant/security/access/page.tsx`
- Priority: P0
- Acceptance criteria:
  - no critical auth/security workspace in nav is placeholder-only
  - each visible security page has real data and a clear purpose

### 6. Make observability pages operational, not aspirational

- Problem statement: Health exists, but alerts and logs are incomplete or mislabeled.
- Recommended implementation: Build true alerts inboxes, clarify log-vs-audit semantics, and connect health cards to remediation routes.
- Impacted files/modules if known: `apps/admin-console/app/admin/platform/health/platform-health-page.tsx`, `apps/admin-console/app/admin/platform/operations/alerts/page.tsx`, `apps/admin-console/app/admin/tenant/operations/alerts/page.tsx`, `apps/admin-console/app/admin/platform/operations/logs/page.tsx`
- Priority: P0
- Acceptance criteria:
  - alert pages show real alert data or are removed
  - “logs” is not just an audit alias unless explicitly renamed
  - health surfaces have actionable drill-ins

## Phase 2: Operational readiness gaps

### 7. Break tenant configuration into modular admin workspaces

- Problem statement: `TenantAdminSettings` is doing too much in one dense page.
- Recommended implementation: Split branding, notifications, integrations, webhooks, modules, and user access into clearer sections or tabs using shared admin patterns.
- Impacted files/modules if known: `apps/admin-console/app/tenant-admin/tenant-admin-settings.tsx`
- Priority: P1
- Acceptance criteria:
  - each configuration domain is visually separated
  - section-level save feedback is clear
  - dangerous changes are easier to review before applying

### 8. Introduce aggregated platform admin summary APIs

- Problem statement: Several platform pages build data through repeated tenant-by-tenant requests, which will not scale well operationally.
- Recommended implementation: Add aggregated summary endpoints for tenant health, configuration, connectors, and adapter inventory.
- Impacted files/modules if known: `apps/admin-console/app/admin/platform/tenants/tenant-pages.tsx`, `apps/admin-console/app/admin/platform/connectivity/adapters/page.tsx`, `apps/api/src/routes/tenant-admin.ts`, `apps/api/src/routes/connectors.ts`
- Priority: P1
- Acceptance criteria:
  - platform dashboards no longer depend on N+1 tenant settings fetches
  - page load time and request count are materially reduced

### 9. Add real tenant role and policy review surfaces

- Problem statement: Tenant roles and access policies are discoverable but not actually operable.
- Recommended implementation: Build tenant role summaries, effective permission views, and policy review pages, or intentionally consolidate them into users/configuration.
- Impacted files/modules if known: `apps/admin-console/app/admin/tenant/roles/page.tsx`, `apps/admin-console/app/admin/tenant/security/access/page.tsx`
- Priority: P1
- Acceptance criteria:
  - tenant admins can review role and access posture in a dedicated, non-placeholder workflow

### 10. Harden feature-flag governance

- Problem statement: Feature flags can be created and toggled, but governance is weak.
- Recommended implementation: Add delete/archive, filtering, ownership metadata, audit visibility, and environment semantics.
- Impacted files/modules if known: `apps/admin-console/app/feature-flags/feature-flag-management.tsx`, `apps/api/src/routes/feature-flags.ts`, `apps/api/src/services/feature-flag-service.ts`
- Priority: P1
- Acceptance criteria:
  - operators can safely manage lifecycle and understand scope/ownership of each flag

### 11. Improve jobs monitoring with deeper workflow support

- Problem statement: Job screens are useful but shallow.
- Recommended implementation: Add job details, payload visibility rules, retry history, and additional action controls where safe.
- Impacted files/modules if known: `apps/admin-console/components/jobs-monitoring-page.tsx`, `apps/api/src/routes/jobs.ts`
- Priority: P1
- Acceptance criteria:
  - jobs page supports investigation and action, not just status listing

### 12. Formalize support tooling and remove unsafe pseudo-impersonation

- Problem statement: The hidden tenant document admin page uses direct user scoping via headers and is not a production-grade support tool.
- Recommended implementation: Design a proper support access model with explicit “act as” controls, audit logging, and approvals, or remove the page.
- Impacted files/modules if known: `apps/admin-console/app/documents/document-management.tsx`, `apps/admin-console/app/tenant-admin/documents/page.tsx`, `apps/api/src/routes/documents.ts`
- Priority: P1
- Acceptance criteria:
  - support tooling is explicit, governed, and audited
  - no hidden impersonation-like pattern remains

## Phase 3: UX polish and optimization

### 13. Adopt shared admin primitives across all active pages

- Problem statement: Shared admin page patterns now exist but are only partially adopted.
- Recommended implementation: Migrate active pages to `AdminPageLayout`, shared empty/loading/error states, and common action-bar/table patterns.
- Impacted files/modules if known: `apps/admin-console/components/admin-ui.tsx`, active pages under `apps/admin-console/app/admin/**`
- Priority: P2
- Acceptance criteria:
  - active admin pages have consistent headers, spacing, states, and action placement

### 14. Add admin-wide search / quick lookup

- Problem statement: Operators lack a fast way to find tenants, users, connectors, flags, or audit targets.
- Recommended implementation: Introduce an admin search workspace and shell-level quick lookup backed by platform admin APIs.
- Impacted files/modules if known: `apps/admin-console/components/top-header.tsx`, new admin search route, new backend search surface
- Priority: P2
- Acceptance criteria:
  - operators can quickly locate core administrative records from one search surface

### 15. Replace generic tables with reusable admin data-table patterns

- Problem statement: Tables and list-heavy screens are inconsistent and often lack obvious filters, summaries, or actions.
- Recommended implementation: Introduce an admin table wrapper with consistent header, filters, empty state, and row-action affordances.
- Impacted files/modules if known: `apps/admin-console/components/audit-log-page.tsx`, `apps/admin-console/components/jobs-monitoring-page.tsx`, `apps/admin-console/components/user-list-page.tsx`
- Priority: P2
- Acceptance criteria:
  - major list/table pages share consistent interaction patterns

### 16. Add route-level loading and error boundaries

- Problem statement: Many pages still manage loading and failure states ad hoc.
- Recommended implementation: Add route-level `loading.tsx` / `error.tsx` where appropriate and reuse shared admin state components.
- Impacted files/modules if known: `apps/admin-console/app/admin/**`, shared admin components
- Priority: P2
- Acceptance criteria:
  - route transitions and failures are handled consistently across the admin app
