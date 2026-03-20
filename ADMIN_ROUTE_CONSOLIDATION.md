# Admin Route Consolidation

## Summary

The admin console previously had four route families with overlapping ownership:

- `/admin` for the newer command-center experience
- `/platform` for legacy platform operations pages
- `/platform-admin` for older platform administration pages
- `/tenant-admin` for older tenant administration pages

This consolidation makes `/admin` the canonical admin architecture and converts the legacy route trees into explicit redirects so they no longer behave like parallel implementations.

## Route Trees Found

### Canonical tree

- `/admin`
- `/admin/platform/*`
- `/admin/tenant/*`

### Legacy trees

- `/platform`
- `/platform/audit`
- `/platform/metrics`
- `/platform/settings`
- `/platform/tenants`
- `/platform/tenants/create`
- `/platform/users`
- `/platform-admin`
- `/platform-admin/feature-flags`
- `/platform-admin/roles`
- `/platform-admin/tenants`
- `/platform-admin/users`
- `/tenant-admin`
- `/tenant-admin/documents`

## Canonical Replacements

| Legacy route | Canonical route | Notes |
| --- | --- | --- |
| `/platform` | `/admin/platform/health` | Legacy dashboard retired in favor of platform health command center. |
| `/platform/audit` | `/admin/platform/audit` | Detailed audit workspace already exists under `/admin`. |
| `/platform/metrics` | `/admin/platform/metrics` | Shared metrics panel remains in use via canonical route. |
| `/platform/settings` | `/admin/platform/settings` | Legacy static settings page retired. |
| `/platform/tenants` | `/admin/platform/tenants` | Canonical tenant workspace owns platform tenant operations. |
| `/platform/tenants/create` | `/admin/platform/tenants/provisioning` | Tenant creation normalized under provisioning. |
| `/platform/users` | `/admin/platform/users` | Platform user management now has one entry point. |
| `/platform-admin` | `/admin/platform/health` | Platform root normalized to health landing page. |
| `/platform-admin/feature-flags` | `/admin/platform/feature-flags` | Canonical feature flag workspace retained. |
| `/platform-admin/roles` | `/admin/platform/roles` | Canonical role management retained. |
| `/platform-admin/tenants` | `/admin/platform/tenants` | Duplicate tenant landing removed. |
| `/platform-admin/users` | `/admin/platform/users` | Duplicate user administration removed. |
| `/tenant-admin` | `/admin/tenant/configuration` | Canonical tenant configuration retained. |
| `/tenant-admin/documents` | `/admin/tenant/documents` | New canonical tenant documents route added to preserve functionality. |

## Redirects Introduced

Legacy route pages now use server-side `redirect(...)` to send operators to their canonical `/admin` replacements:

- `apps/admin-console/app/platform/page.tsx`
- `apps/admin-console/app/platform/audit/page.tsx`
- `apps/admin-console/app/platform/metrics/page.tsx`
- `apps/admin-console/app/platform/settings/page.tsx`
- `apps/admin-console/app/platform/tenants/page.tsx`
- `apps/admin-console/app/platform/tenants/create/page.tsx`
- `apps/admin-console/app/platform/users/page.tsx`
- `apps/admin-console/app/platform-admin/page.tsx`
- `apps/admin-console/app/platform-admin/feature-flags/page.tsx`
- `apps/admin-console/app/platform-admin/roles/page.tsx`
- `apps/admin-console/app/platform-admin/tenants/page.tsx`
- `apps/admin-console/app/platform-admin/users/page.tsx`
- `apps/admin-console/app/tenant-admin/page.tsx`
- `apps/admin-console/app/tenant-admin/documents/page.tsx`

## Canonical Routing Model

### Platform administration

- `/admin/platform/health`
- `/admin/platform/metrics`
- `/admin/platform/audit-overview`
- `/admin/platform/audit`
- `/admin/platform/tenants`
- `/admin/platform/tenants/[tenantId]`
- `/admin/platform/tenants/provisioning`
- `/admin/platform/tenants/configuration`
- `/admin/platform/users`
- `/admin/platform/roles`
- `/admin/platform/connectivity`
- `/admin/platform/connectivity/adapters`
- `/admin/platform/connectivity/identity`
- `/admin/platform/settings`
- `/admin/platform/reference-data`
- `/admin/platform/feature-flags`
- `/admin/platform/operations/jobs`
- `/admin/platform/operations/alerts`
- `/admin/platform/operations/logs`
- `/admin/platform/security/permissions`
- `/admin/platform/security/sessions`

### Tenant administration

- `/admin/tenant/health`
- `/admin/tenant/metrics`
- `/admin/tenant/profile`
- `/admin/tenant/configuration`
- `/admin/tenant/documents`
- `/admin/tenant/users`
- `/admin/tenant/roles`
- `/admin/tenant/connectivity`
- `/admin/tenant/connectivity/sso`
- `/admin/tenant/operations/jobs`
- `/admin/tenant/operations/alerts`
- `/admin/tenant/audit`
- `/admin/tenant/security/access`

## Navigation Changes

- Tenant navigation now exposes `/admin/tenant/documents` in the canonical menu.
- Admin login redirect handling now canonicalizes legacy deep links before route handoff.
- Internal admin route context continues to resolve from `/admin` menu definitions only.

## Routes Retired

The following pages are no longer live implementations and should not receive new feature work:

- all `page.tsx` files under `apps/admin-console/app/platform/*`
- all `page.tsx` files under `apps/admin-console/app/platform-admin/*`
- all `page.tsx` files under `apps/admin-console/app/tenant-admin/*`

Shared implementation modules that still live under older folders remain in service temporarily, including:

- `apps/admin-console/app/platform/audit/platform-audit-log.tsx`
- `apps/admin-console/app/platform/metrics/platform-metrics-panel.tsx`
- `apps/admin-console/app/tenant-admin/tenant-admin-settings.tsx`

These are code-location leftovers, not route-level duplicates.

## Risks Addressed

- Removed multiple live entry points for the same admin capability.
- Prevented platform and tenant admin features from drifting across separate route trees.
- Reduced support risk from bookmarked legacy URLs by preserving safe redirects.
- Normalized admin login handoff so old redirect parameters land in canonical `/admin` space.
- Preserved tenant document management by creating a canonical `/admin/tenant/documents` route before retiring `/tenant-admin/documents`.

## Follow-Up Cleanup Recommendations

1. Move shared legacy implementation modules into canonical folders so file ownership matches route ownership.
2. Add route-level `loading.tsx` and `error.tsx` files for the `/admin` tree.
3. Add integration tests covering legacy-to-canonical redirect mappings.
4. Audit any external bookmarks, demo scripts, or operational runbooks that still mention `/platform`, `/platform-admin`, or `/tenant-admin`.
5. Consider middleware-level canonicalization if additional legacy deep links appear outside the known mappings.
