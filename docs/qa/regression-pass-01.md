# Regression Pass 01

Date: 2026-03-22

## Scope

- Member portal
- Provider portal
- Employer portal
- Broker Employer portal
- Broker Individual / ACA portal
- Platform admin portal
- Shared runtime/config/session helpers touched by those surfaces

## Validation summary

### Verified during this pass

- Full repo `pnpm build` passed.
- Full repo `pnpm typecheck` passed.
- `pnpm lint` passed with warnings only.
- Local stack booted cleanly.
- Major route probes returned expected `200` or auth redirects without fatal runtime errors:
  - `/login`
  - `/dashboard`
  - `/provider/dashboard`
  - `/employer`
  - `/broker`
  - `/individual`
  - `/admin`
  - `/admin/platform/connectivity/adapters`
  - `/health` on portal-web, admin-console, and api

### Overall assessment

- Functional regression status: PARTIAL PASS
- Architecture adherence status: FAIL
- Route cleanup status: FAIL
- Lazy workspace standardization status: PARTIAL FAIL
- Persona/session isolation status: FAIL

## Findings

### REG-01

- ID: REG-01
- Title: Tenant admin control plane is still active inside `portal-web`
- Severity: High
- Category: Architecture violation
- Affected app/page: `portal-web` `/tenant-admin/*`, billing-enrollment admin redirect routes
- Reproduction steps:
  1. Open [tenant-admin page](../../apps/portal-web/app/tenant-admin/page.tsx).
  2. Follow the tenant-admin route chain in [middleware](../../apps/portal-web/middleware.ts).
  3. Inspect the rendered shell in [tenant-admin-shell.tsx](../../apps/portal-web/components/tenant-admin/tenant-admin-shell.tsx).
  4. Inspect billing-enrollment administration redirects such as [administration/page.tsx](../../apps/portal-web/app/dashboard/billing-enrollment/administration/page.tsx).
- Expected result: Tenant admin workflows should live only in the separate admin portal shell under `/admin`, with no active admin control plane inside the end-user portal.
- Actual result: `portal-web` still hosts a full tenant-admin route tree and shell, and billing-enrollment administration routes redirect into that legacy tenant-admin surface.
- Suspected root cause: Legacy tenant-admin implementation was retained in `portal-web` rather than fully consolidating onto `admin-console`.
- Recommended fix approach: Remove active tenant-admin routes and shell from `portal-web`, redirect all surviving entry points to the canonical `admin-console` `/admin/tenant/...` routes, and keep portal-web limited to end-user and preview use cases only.

### REG-02

- ID: REG-02
- Title: Legacy admin route trees remain active through redirect aliases
- Severity: Medium
- Category: Routing
- Affected app/page: `admin-console` `/platform/*`, `/platform-admin/*`, `/tenant-admin/*`
- Reproduction steps:
  1. Open `http://127.0.0.1:3003/platform-admin`.
  2. Open `http://127.0.0.1:3003/tenant-admin`.
  3. Inspect [admin-route-aliases.ts](../../apps/admin-console/lib/admin-route-aliases.ts).
  4. Inspect legacy redirect pages such as [platform-admin/users/page.tsx](../../apps/admin-console/app/platform-admin/users/page.tsx) and [platform/metrics/page.tsx](../../apps/admin-console/app/platform/metrics/page.tsx).
- Expected result: Legacy `/platform`, `/platform-admin`, and `/tenant-admin` flows should be removed or explicitly justified and tightly scoped.
- Actual result: All three legacy trees are still live and redirect into the new `/admin/...` routes.
- Suspected root cause: Compatibility aliases were retained during route consolidation and never removed after the canonical `/admin` shell was introduced.
- Recommended fix approach: Remove legacy route trees and alias canonicalization once downstream references are updated, or isolate them behind a short-lived migration layer with explicit expiry and test coverage.

### REG-03

- ID: REG-03
- Title: Broker dashboard still preloads workspace datasets before any tab is opened
- Severity: Medium
- Category: Performance symptom
- Affected app/page: `portal-web` `/broker`
- Reproduction steps:
  1. Inspect [broker/page.tsx](../../apps/portal-web/app/broker/page.tsx).
  2. Note that it loads broker cases, commissions, renewals, quotes, and book-of-business groups before first render.
  3. Inspect [BrokerDashboardWorkspaceSection.tsx](../../apps/portal-web/components/billing-enrollment/BrokerDashboardWorkspaceSection.tsx), which receives those datasets after the page has already materialized them.
- Expected result: The broker dashboard should render a lighter summary first and load workspace-specific data only when the corresponding tab is opened.
- Actual result: The tab UI is lazy at the component level, but the expensive broker datasets are still assembled up front on the initial request, so the initial render remains heavier than intended.
- Suspected root cause: Lazy workspace standardization was applied at the component-loader layer, but the broker page still resolves all workspace backing data eagerly on the server.
- Recommended fix approach: Move broker workspace data loading behind per-workspace route handlers or client boundaries, and cache those responses by session the same way member and employer workspace data is cached.

### REG-04

- ID: REG-04
- Title: Persona session state leaks across admin browser tabs via `localStorage`
- Severity: High
- Category: Session/persona behavior
- Affected app/page: `admin-console` `/admin`
- Reproduction steps:
  1. Inspect [admin-platform-sessions.ts](../../apps/admin-console/lib/admin-platform-sessions.ts).
  2. Note that `PERSONA_SESSION_STORAGE_KEY` and `ACTIVE_PERSONA_SESSION_STORAGE_KEY` are persisted in `window.localStorage`.
  3. Inspect [admin-platform-session-manager.tsx](../../apps/admin-console/components/admin-platform/admin-platform-session-manager.tsx), which loads those values on mount.
  4. Open two admin tabs in the same browser profile and create persona sessions in one tab.
- Expected result: Persona window state should be isolated per active admin session surface or held in an authoritative backend/session registry, not silently shared across all browser tabs.
- Actual result: Persona sessions and focused-session state are browser-global for the origin, so one tab can inherit another tab’s persona session list and active selection.
- Suspected root cause: The session manager persists operational persona state in `localStorage` rather than `sessionStorage` or a server-owned session store.
- Recommended fix approach: Scope persona window state to browser-tab/session storage, or move it to a server-managed session registry keyed by the authenticated admin session.

### REG-05

- ID: REG-05
- Title: Persona workspace identity is mutable through query-string edits
- Severity: High
- Category: Architecture violation
- Affected app/page: `admin-console` `/admin/workspace/[sessionId]`
- Reproduction steps:
  1. Open [workspace page route](../../apps/admin-console/app/admin/workspace/[sessionId]/page.tsx).
  2. Observe that `tenantId`, `personaType`, and `userId` come directly from `searchParams`.
  3. Inspect [admin-persona-workspace.tsx](../../apps/admin-console/components/admin-platform/admin-persona-workspace.tsx), which renders those values without validating them against an authoritative session record.
  4. Change the query string in the browser for an existing workspace route.
- Expected result: `sessionId` should resolve one immutable session record `{ tenantId, personaType, userId }`, and the page should reject or ignore conflicting URL parameters.
- Actual result: The displayed persona session context can be changed by editing query parameters, so the route is not actually bound to an authoritative session model.
- Suspected root cause: The route was implemented as a presentational container and never wired back to the session manager or backend session store.
- Recommended fix approach: Resolve workspace context from `sessionId` only, validate that the session belongs to the current admin context, and treat URL query parameters as non-authoritative or remove them entirely.

## Additional notes

### Standardized dashboard behavior

- Member dashboard: standardized lazy workspace pattern present, with session-scoped client caching and server-side session cache wrappers.
- Employer dashboard: standardized lazy workspace pattern present, with session-scoped client caching and server-side session cache wrappers.
- Broker dashboard: tab UI present, but initial data loading is still eager.
- Provider dashboard: medical variant uses the shared workspace shell; other provider variants still follow older config-driven dashboard rendering.

### API catalog

- No blocking regression was confirmed in the updated API catalog during this pass.
- Catalog routes built successfully and `/admin/platform/connectivity/catalog` remained bootable in the stabilized stack.

### No-issue areas checked

- Admin shell/theme token separation from tenant portal shells remained intact in the validated code paths.
- Health, readiness, and liveness endpoints remained reachable after stabilization.
