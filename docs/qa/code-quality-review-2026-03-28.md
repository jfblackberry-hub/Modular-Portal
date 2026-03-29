# Code Quality Review — Modular Payer Portal
**Date:** 2026-03-28
**Scope:** Full codebase — all apps, packages, plugins, and infrastructure
**Reviewed by:** Claude Code (automated multi-agent analysis)

---

## Table of Contents

1. [API Backend](#1-api-backend-appsapi)
2. [Portal-Web Frontend](#2-portal-web-frontend-appsportal-web)
3. [Admin Console Frontend](#3-admin-console-frontend-appsadmin-console)
4. [Database Layer](#4-database-layer-packagesdatabase-packagescanonical-model)
5. [Plugin SDK + Plugins](#5-plugin-sdk--plugins)
6. [Shared Infrastructure](#6-shared-infrastructure-packagesserver-packagesconfig-packagesapi-gateway)
7. [Shared Types / Utils / UI / Contracts](#7-shared-types--utils--ui--contracts)
8. [Overall Priority Summary](#overall-priority-summary)

---

## 1. API Backend (`apps/api`)

### Bugs

| # | File | Issue |
|---|------|-------|
| 1.1 | `portal-auth-handoff-service.ts:116` | `consumePortalHandoff` does not verify `tenantId` on the handoff record — partial multi-tenant isolation bypass |
| 1.2 | `portal-auth-handoff-service.ts:116-176` | TOCTOU race: `findFirst` check then `updateMany` consume can be exploited by concurrent requests |
| 1.3 | `member.ts:211,250` | Hardcoded mock values (`dob: '1989-06-15'`, `memberNumber: 'M00012345'`) returned as defaults when catalog is unavailable — test data leaks to production |
| 1.4 | `feature-flags.ts:92` | PATCH endpoint returns data without `reply.status(200).send()` — incorrect HTTP status codes |

### Sloppy Coding

| # | File | Issue |
|---|------|-------|
| 2.1 | Multiple routes | Inconsistent error handling — `audit.ts` has centralized `handleRouteError`, others have inline duplicated logic |
| 2.2 | `audit.ts:110-177` | Tenant-admin audit route lacks pagination enforcement; could return unlimited rows |
| 2.3 | `search.ts:18` | Empty string query accepted without validation — unnecessary DB queries |
| 2.4 | `member.ts:24,219` | `mockPermissions` fallback is dead code (`flatMap` always returns an array) — misleading |
| 2.5 | `connectors.ts:73-95` | `request.body` passed directly to service without explicit schema validation at the route layer |

### Architecture Violations

| # | File | Issue |
|---|------|-------|
| 3.1 | `billing-enrollment.ts:405-544` | Dashboard fetches up to 500 records per category then filters in application memory — should push WHERE clauses to the database |
| 3.2 | `admin-operations-service.ts:161-183` | `getPlatformHealthOverview` runs `tenant.findMany()` and `user.findMany()` with no limit — will OOM at scale |
| 3.3 | `role-service.ts:729+` | 4-level-deep nested include on roles/permissions creates large result sets; N+1 risk in bulk operations |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | `admin-operations-service.ts:164` | Unbounded `tenant.findMany` / `user.findMany` in health overview endpoint |
| 4.2 | `billing-enrollment.ts:478-545` | Client-side array filter repeated 5+ times on 500-item arrays with `JSON.parse` per iteration |
| 4.3 | `billing-enrollment.ts:534` | Repeated `.toUpperCase()` calls on same strings every render |
| 4.4 | Multiple services | No composite indexes on `(tenantId, createdAt)` for high-volume tables (notifications, documents, audit logs) |
| 4.5 | `connector-service.ts:36` | `adapterKey` and `name` not validated for length or format |
| 4.6 | `admin-operations-service.ts:8-9`, `preview-session-service.ts:63` | Magic constants scattered across services instead of centralized config |
| 4.7 | `documents.ts:108-132` | No file size limit before converting upload to buffer — DoS via large file upload |

---

## 2. Portal-Web Frontend (`apps/portal-web`)

### Bugs

| # | File | Issue |
|---|------|-------|
| 1.1 | `billing-enrollment-api.ts:131` | `getBillingEnrollmentOverview(userId)` accepts `userId` but `resolveAccessToken()` ignores it — unused parameter with misleading contract |
| 1.2 | `billing-enrollment-api.ts:268,340`, `dependents/route.ts:14,41` | Multiple functions default to hardcoded `householdId = 'hh-8843'` — test data in production, potential data scoping bypass |
| 1.3 | `provider-operations-widget-registry.tsx:131-134` | Accesses `metrics[0]`, `metrics[1]`, `metrics[4]` without bounds checking; metrics arrays default to empty `[]` |

### Sloppy Coding

| # | File | Issue |
|---|------|-------|
| 2.1 | `member-api.ts:21-35` | All fetch errors silently return `null` with no logging — impossible to distinguish "not found" from "network failure" |
| 2.2 | API route handlers | All errors return 502 with no request/response logging — no visibility into failures |
| 2.3 | `dashboard/billing/page.tsx:16-24`, `BillingEnrollmentWorkspace.tsx:73-88` | Hardcoded values ($184.22, "Apr 1, 2026", "14 cases") — static placeholders never wired to real data |
| 2.4 | `dependents/[dependentId]/route.ts:41` | User-supplied `householdId` from query params not validated against authenticated user's tenant |

### Architecture Violations

| # | File | Issue |
|---|------|-------|
| 3.1 | `tenant-modules.ts:54-81` | Returns `true` (fail-open) when `purchasedModules` is null — all modules enabled if tenant context is missing |
| 3.2 | `loadTenantTheme.ts:45-71` | CSS variables (`logoUrl`, `heroImageUrl`, `primaryColor`) set from session cookie without URL or value validation — XSS / CSS injection risk |
| 3.3 | `api-request.ts:14-26` | Not all API calls use `buildPortalApiHeaders()` with tenant ID — direct `fetch` calls in `member-api.ts` may bypass tenant scoping |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | `BillingExperience.tsx:81-91` | 10 separate `useState` calls for tightly coupled state (payment tone, payment message, 3 loading flags) — should be one state object or custom hook |
| 4.2 | `BillingExperience.tsx` | `handleMakePayment` and `handleAutopayToggle` not memoized — unnecessary child re-renders |
| 4.3 | `use-provider-operations-live-dashboard.ts:70-108` | EventSource handlers registered after open; unmount cleanup may not prevent stale state updates — memory leak risk |
| 4.4 | Member pages | No error boundaries on async server components — any API failure crashes the entire page |
| 4.5 | `member/coverage/page.tsx:16` | Fallback message "until the local API is running" is developer-facing text exposed to end users |
| 4.6 | `demo-access.ts:3-8` | Demo credentials (`Anorth123`, `Cgallagher123`) hardcoded in production source |
| 4.7 | `billing-enrollment-api.ts:24-33` | Collections typed as `Array<Record<string, unknown>>` — no type safety on API responses |
| 4.8 | `portal-session-cookie.ts` vs `portal-session.ts` | `PortalUserCookie` and `PortalSessionUser` are slightly different structures with duplicated validation logic |

---

## 3. Admin Console Frontend (`apps/admin-console`)

### Critical Architecture Violations

| # | File | Issue |
|---|------|-------|
| 1.1 | `tenants/[tenantId]/organization/page.tsx` | `TenantAdminGate` checks role but never validates that `tenantId` in the URL matches the user's session `tenantId` — a tenant admin can navigate to another tenant's URL and attempt data access |
| 1.2 | `admin-login-form.tsx:90,107,175,181,197` | `redirectPath` taken from URL query params and used in `window.location.assign()` without allowlist validation — open redirect vulnerability |

### Bugs / Logic Errors

| # | File | Issue |
|---|------|-------|
| 2.1 | `tenant-pages.tsx:606-611` | `Number.parseInt()` on form strings without `Number.isNaN()` check — invalid input (e.g., "abc") produces `NaN` sent to API |
| 2.2 | `admin-client-data.ts:45-59` | Cache key defaults to `'platform'` when no `x-tenant-id` header is present — cross-tenant cache collision; tenant A could receive cached data for tenant B |
| 2.3 | `admin-client-data.ts:78` | API errors throw generic message with no status code, body, or context — debugging blind |

### Sloppy Coding

| # | File | Issue |
|---|------|-------|
| 3.1 | `admin-session-cookie.ts:19` | `SESSION_COOKIE_VERSION = 1` hardcoded with no migration path if format changes |
| 3.2 | `tenant-pages.tsx:159` | `alertKeywords` array hardcoded inline and likely duplicated elsewhere |
| 3.3 | `tenant-pages.tsx:616-620` | Error handling pattern `response.json().catch(() => null)` copy-pasted 20+ times with slight variations — no centralized error handler |
| 3.4 | `api-auth.ts:6-12` | `LEGACY_ADMIN_SESSION_STORAGE_KEY` still read at line 114 — old key branching adds unnecessary complexity |
| 3.5 | `admin-login-query.ts` | Entire file is a single 2-line utility (`isReturnToPortalRequest`) that appears unused outside tests |
| 3.6 | `tenant-pages.tsx:988` | `event.target.value as Tenant['status']` — cast without validation; manipulated dropdown values sent to API unvalidated |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | `tenant-pages.tsx:338-344` | Tenant list fetched with no pagination — single request returns all tenants; will timeout at scale |
| 4.2 | `tenant-pages.tsx:211` | Audit event page size hardcoded at `8` with no way to paginate or increase |
| 4.3 | `ApiCatalogPage.tsx:172-197` | All API catalog entries loaded into memory, filtered client-side on every keystroke — no server-side search or pagination |
| 4.4 | `admin-client-data.ts:8-14` | `responseCache` Map grows unbounded — no TTL-based eviction, only manual `clearAdminClientCache()` — long sessions exhaust memory |
| 4.5 | `admin-session-provider.tsx:44-78` | `loadSession()` called once on mount, never refreshed — expired sessions continue silently until reload |
| 4.6 | `tenant-pages.tsx:584-631` | `handleSaveTenantDetails` has no in-flight guard — double-clicking Save fires two concurrent requests, last write wins |

---

## 4. Database Layer (`packages/database`, `packages/canonical-model`)

### Bugs

| # | File | Issue |
|---|------|-------|
| 1.1 | `seed.ts:334-362` | Two platform admin roles created with different codes (`platform-admin` vs `platform_admin`) — one is orphaned; only `platform_admin` is ever assigned |
| 1.2 | `seed.ts:441,945` | `DEFAULT_MEMBER_LOGIN` constant used 500 lines before it is defined — works via hoisting but violates define-before-use |
| 1.3 | `schema.prisma:177-197` | `PreviewSession` has no constraint ensuring `adminUserId` and `targetUserId` belong to the same `tenantId` — critical cross-tenant isolation break |

### Sloppy Coding

| # | File | Issue |
|---|------|-------|
| 2.1 | `schema.prisma:195-197,501,547` | Inconsistent cascade behaviors on user deletion: PreviewSession cascades admin but nullifies target; AuditLog restricts deletion entirely |
| 2.2 | `schema.prisma` (15+ locations) | Unbounded `Json` fields (`brandingConfig`, `metadata`, `config`, `payload`, `userSnapshot`, etc.) with no schema, no size constraints, no index strategy |
| 2.3 | `schema.prisma:396-413` | `ConnectorConfig` has separate indexes on `tenantId`, `adapterKey`, `status` but no composite `(tenantId, status)` for the common query pattern |
| 2.4 | `schema.prisma:532-556` | Audit log immutability enforced only via migration-0019 trigger — if migrations run out of order, audit logs become mutable |
| 2.5 | `schema.prisma` | No `deletedAt` soft-delete on `Tenant`, `User`, `EmployerGroup` — only `isActive` boolean; no recovery window, no GDPR grace period |

### Architecture Violations

| # | File | Issue |
|---|------|-------|
| 3.1 | `schema.prisma:182` | `PreviewSession.subTenantId` is a plain nullable string with no foreign key, no constraint, no validation — attackers can claim any UUID |
| 3.2 | `schema.prisma:16-22,51-90` | `Tenant` stores both `type TenantType` (enum) and `tenantTypeCode String` — two sources of truth for the same concept; migration-0034 shows them already diverging |
| 3.3 | `schema.prisma:415-435` | `IntegrationExecution` has no constraint ensuring `connectorConfig.tenantId == tenantId` — cross-tenant execution records possible |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | `migrations/` | Data migration (0034) sandwiched between schema migrations (0033, 0035) — if 0034 fails mid-run, 0035 produces corrupt state |
| 4.2 | `schema.prisma:213` | `PortalAuthHandoff.userSnapshot Json` — no size limit; malicious actors can store arbitrarily large JSON blobs |
| 4.3 | `schema.prisma:532-556` | `AuditLog` has no archiving strategy, no partitioning, no retention policy — unbounded table growth |
| 4.4 | `schema.prisma:620-655` | `EventDelivery` stores retry metadata but exponential backoff logic lives entirely in application code — behavior diverges across instances |

---

## 5. Plugin SDK + Plugins

### Bugs

| # | File | Issue |
|---|------|-------|
| 1.1 | `broker/src/index.ts` | No `moduleKeys` declared on any broker capability — module licensing checks will not gate broker features |
| 1.2 | `broker/src/index.ts:3-13` | Both `'broker_readonly'` and `'broker_read_only'` declared as valid roles — duplicate conflicting names |
| 1.3 | `enrollment/src/index.ts:8-9,15-16` | Both `'platform_admin'` and `'platform-admin'` declared in role arrays — same naming inconsistency |

### Sloppy Coding

| # | File | Issue |
|---|------|-------|
| 2.1 | `provider/src/index.ts:111-157` | `PROVIDER_POC_SCOPE_EXCLUSIONS` spread at manifest level and again inside first capability — changes must be made in two places |
| 2.2 | All plugins | `moduleKeys` present in member, provider, enrollment but entirely absent in broker — inconsistent implementation of the SDK contract |
| 2.3 | `provider/src/index.ts:159` | Reporting capability declares a route but `navigation: []` — feature is unreachable from the UI |

### Architecture Violations

| # | File | Issue |
|---|------|-------|
| 3.1 | `plugin-sdk/src/index.ts` | No runtime validation of plugin manifests — TypeScript types disappear at runtime; misconfigured plugins fail silently in production |
| 3.2 | `provider/src/index.ts:3-15` | Provider plugin exports internal constants (`PROVIDER_OPERATIONS_CAPABILITY_ID`, scope exclusions) for external consumption — breaks plugin encapsulation |
| 3.3 | `plugin-sdk/src/index.ts:43` | `PluginManifest` has no `interfaceVersion` field — no way to detect SDK/plugin version mismatches; adding any required field is a silent breaking change for all plugins |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | All plugins + SDK | Zero test coverage — `test` script logs "No tests configured"; permission merging, role resolution, and feature flag logic are completely untested |
| 4.2 | `plugin-sdk/src/index.ts:33-51` | Too many optional fields (`audiences`, `featureFlagKeys`, `requiredPermissions`, `moduleKeys`, etc.) — SDK provides no guidance on what plugins must declare vs. may omit |
| 4.3 | All plugins | Plugin IDs are arbitrary strings with no namespace or uniqueness enforcement — ID collisions possible as plugin count grows |
| 4.4 | `plugin-sdk/src/index.ts:72-76,137-146` | Permission merging uses `flatMap` (OR semantics) but this is nowhere documented — developers may assume AND semantics and build incorrect access control |

---

## 6. Shared Infrastructure (`packages/server`, `packages/config`, `packages/api-gateway`)

### Critical Issues

| # | File | Issue |
|---|------|-------|
| 1.1 | `api-gateway/src/index.ts:86,142-173` | Rate limiter uses an unbounded `Map` that never evicts expired entries — silent memory leak leading to OOM in production |
| 1.2 | `api-gateway/src/server.ts:5-16` | No `SIGTERM`/`SIGINT` handlers, no request draining — abrupt shutdown mid-request on every deployment |
| 1.3 | `server/src/jobs/jobQueue.ts:164-202` | Retry backoff is `attempts * 60_000ms` — first retry is `0 * 60k = 0ms`, causing instant requeue loop; busy-spins and starves other jobs |

### Security / Config

| # | File | Issue |
|---|------|-------|
| 2.1 | `config/src/index.ts:836` | API Gateway `databaseUrl` is optional in config but health check does `prisma.$queryRaw` — starts without DB then crashes on first health check |
| 2.2 | `config/src/index.ts:433-456` | Missing secrets in non-dev environments fall back to a predictable placeholder string instead of hard-failing |
| 2.3 | `config/src/portal-handoff.ts:64,73-74` | Length check occurs before timing-safe comparison — timing side-channel on JWT signature validation |
| 2.4 | `api-gateway/src/index.ts:226,233` | Tenant ID written to response header before auth completes — error responses may leak tenant context to unauthenticated callers |

### Observability

| # | File | Issue |
|---|------|-------|
| 3.1 | `server/src/monitoring/telemetry.ts:234-359` | Telemetry refresh errors caught silently — `refreshSucceeded = false` is set but never logged or alerted on |
| 3.2 | `api-gateway/src/index.ts:741-765` | Every request logged at INFO on start AND completion — extremely noisy at scale; no level filtering |
| 3.3 | `server/src/services/auditService.ts:360-369` | Audit errors rethrow as generic `AuditLogWriteError` swallowing the original cause |
| 3.4 | `server/src/integrations/service.ts:252-356` | Raw `error.message` (may include DB schema details, constraint names) stored in execution metadata and potentially returned to clients |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | `api-gateway/src/index.ts:92-97` | `Number(process.env.API_GATEWAY_RATE_LIMIT_MAX ?? 100)` — non-numeric env var produces `NaN`; `NaN <= 0` is false so rate limiting is silently disabled |
| 4.2 | `server/src/monitoring/telemetry.ts:25-41` | Active session tracking uses key `sessionType:userId` with no tenant prefix — users with same ID across tenants collide, producing incorrect metrics |
| 4.3 | `server/src/storage/service.ts:63-80` | Storage service is a module-level singleton — runtime `STORAGE_PROVIDER` env changes ignored until process restart |
| 4.4 | `server/src/services/auditService.ts:146-193` | Sensitive field redaction regex matches any three-part dotted string; custom sensitive fields outside the pattern are not redacted |

---

## 7. Shared Types / Utils / UI / Contracts

### Bugs

| # | File | Issue |
|---|------|-------|
| 1.1 | `shared-types/src/index.ts:28-36` | `isCoreTenantType(null)` and `isCoreTenantType(undefined)` both cast to `CoreTenantType` before the array check — type guards are unsound |
| 1.2 | `shared-types/src/publicAuthRoutes.ts:7` + `api/src/server.ts:77` | `/auth/portal-handoffs/consume` appears in both the suffix list AND as a hardcoded duplicate check — changes to one won't sync |

### Sloppy Coding / Type Issues

| # | File | Issue |
|---|------|-------|
| 2.1 | `api-contracts/src/contracts.ts:27-44` | `status`, `channel`, `type` fields typed as bare `string` — should be enums; allows invalid states and no autocomplete |
| 2.2 | `api-contracts/src/provider-workflows.ts:20-29,46-47` | `payload?: Record<string, unknown>` — different action types need different payload shapes; discriminated union by `actionType` is the correct pattern |
| 2.3 | `ui/src/components/layout/container.tsx:15` | `maxWidth: 1200` hardcoded despite all other values using design tokens |
| 2.4 | `ui/src/components/ui/button.tsx:55-82` | No `disabled` state styling — disabled buttons look clickable; no `aria-disabled` |
| 2.5 | `ui/src/components/ui/card.tsx` | Both `body` and `children` props accepted — ambiguous API; `body ?? children` fallback silently discards one |

### Architecture Violations

| # | File | Issue |
|---|------|-------|
| 3.1 | `shared-types/src/index.ts:38-78` | `normalizeTenantTypeForArchitecture()` encodes domain business rules (PROVIDER→CLINIC, EMPLOYER→PAYER) inside the shared-types package — business logic does not belong in a structural types package |
| 3.2 | `api-contracts/src/openapi.ts:15-30` | OpenAPI responses define `description` only — no `content`/`schema` — spec is not machine-readable for code generation or documentation tools |

### Scalability / Maintainability

| # | File | Issue |
|---|------|-------|
| 4.1 | All packages | All packages stuck at `0.1.0` — no semantic versioning strategy; any change is a silent breaking change for consumers |
| 4.2 | `ui/src/components/layout/container.tsx` | `maxWidth` and `padding` not configurable — every page requiring a different layout must build its own wrapper |

---

## Overall Priority Summary

### P0 — Fix Immediately (Security / Data Isolation)

| Issue | Location |
|-------|----------|
| Cross-tenant cache collision in admin client | `admin-client-data.ts:45-59` |
| `PreviewSession` allows cross-tenant admin/target user pairing | `schema.prisma:177-197` |
| Open redirect vulnerability in admin login flow | `admin-login-form.tsx:90,107,175,181,197` |
| Rate limiter unbounded memory map — OOM in production | `api-gateway/src/index.ts:86` |
| Hardcoded `householdId = 'hh-8843'` default in portal-web | `billing-enrollment-api.ts:268,340` |
| Tenant module check fails open when context is missing | `tenant-modules.ts:54-81` |
| CSS/XSS injection via unvalidated branding config in theme loader | `loadTenantTheme.ts:45-71` |
| `IntegrationExecution` can reference connector from different tenant | `schema.prisma:415-435` |

### P1 — Fix Before Next Release (Reliability / Correctness)

| Issue | Location |
|-------|----------|
| Unbounded `findMany` queries — will OOM at scale | `admin-operations-service.ts:161-183` |
| Billing dashboard client-side filtering of 500-record arrays | `billing-enrollment.ts:405-544` |
| No file upload size limit before buffering | `documents.ts:108-132` |
| Predictable secret placeholder fallback in non-dev environments | `config/src/index.ts:433-456` |
| Job retry backoff starts at 0ms — instant requeue loop | `jobQueue.ts:164-202` |
| No graceful shutdown in API gateway | `api-gateway/src/server.ts:5-16` |
| Demo credentials hardcoded in production source | `portal-web/lib/demo-access.ts:3-8` |
| Duplicate platform admin role codes in seed | `seed.ts:334-362` |

### P2 — Address This Sprint (Code Quality / Maintainability)

| Issue | Location |
|-------|----------|
| Zero test coverage on plugin SDK and all plugins | All plugins + `plugin-sdk` |
| No runtime validation of plugin manifests | `plugin-sdk/src/index.ts` |
| Duplicate/conflicting role names (`broker_readonly` / `broker_read_only`) | `broker/src/index.ts`, `enrollment/src/index.ts` |
| Race condition on double-submit in admin save forms | `tenant-pages.tsx:584-631` |
| 20+ copy-pasted error handling blocks in admin-console | `tenant-pages.tsx` |
| Tenant URL parameter not validated against session in admin routes | `tenants/[tenantId]/organization/page.tsx` |
| `auditLog.ts` tenant-admin route — no pagination | `audit.ts:110-177` |
| `NaN` bypass of rate limit config guard | `api-gateway/src/index.ts:92-97` |
| No error boundaries on async server components in portal-web | Member pages |
| Hardcoded mock values returned in member profile API | `member.ts:211,250` |

### P3 — Technical Debt (Architecture / Design)

| Issue | Location |
|-------|----------|
| `Tenant.type` (enum) and `Tenant.tenantTypeCode` (string) — two sources of truth | `schema.prisma:16-22,51-90` |
| Business logic (`normalizeTenantTypeForArchitecture`) in shared-types | `shared-types/src/index.ts:38-78` |
| Incomplete OpenAPI spec — no `content`/`schema` on responses | `api-contracts/src/openapi.ts` |
| Broad `string` types instead of enums in API contracts | `api-contracts/src/contracts.ts` |
| No soft-delete (`deletedAt`) on Tenant, User, EmployerGroup | `schema.prisma` |
| No archiving/retention strategy for AuditLog | `schema.prisma:532-556` |
| Plugin interface has no `interfaceVersion` field | `plugin-sdk/src/index.ts:43` |
| All packages stuck at `0.1.0` — no semantic versioning | All `package.json` files |
| UI Button component has no disabled state styling or accessibility | `ui/src/components/ui/button.tsx` |
| `responseCache` in admin-console grows unbounded | `admin-client-data.ts:8-14` |
| Unbounded JSON blobs throughout schema with no size constraints | `schema.prisma` (15+ fields) |

---

*Total issues identified: 97 across 7 sections*
*P0: 8 | P1: 8 | P2: 10 | P3: 11 | Remaining: lower severity / technical debt*
