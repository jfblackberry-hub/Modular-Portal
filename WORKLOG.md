# Worklog

## [2026-03-28 22:12]
Branch: fix/admin-tenant-branding
Commit: filter deleted tenants from active admin tenant views (validated: api/server typecheck)

Changes:
- Filter deleted tenants out of platform-admin tenant summaries
- Filter deleted tenants out of platform health tenant datasets
- Add a regression test covering archive, delete, and active-view exclusion behavior

Validation:
- `pnpm --filter @payer-portal/server lint`
- `pnpm --filter api lint`
- UI validation pending at `127.0.0.1:3000`

## [2026-03-29 00:27]
Branch: branding-issues-in-admin-tenant-config
Commit: restore tenant add-user button and tenant-scoped create flow (validated: scoped eslint, local UI)

Changes:
- Route `/admin/tenants/[tenantId]/users` back to the create-capable tenant user list
- Pass the route tenant ID into the shared user list so create-user requests stay tenant-scoped

Validation:
- Verified the add-user button is visible again on the tenant users page
- Scoped ESLint passed for the touched admin-console files

## [2026-03-29 01:59]
Branch: branding-issues-in-admin-tenant-config
Commit: checkpoint merged admin console, tenant management, and auth fixes (validated: local admin login, focused test suites)

Changes:
- Refactor the admin sidebar into an explicit two-level control-plane navigation with user emulation access
- Add platform-admin organization-unit create, edit, delete, and re-parent support for tenant organization structures
- Repair local bootstrap admin identities and retire the generic tenant bootstrap account
- Include related branch changes for billing enrollment scope hardening and admin/session routing support

Validation:
- Verified local admin login works with `admin` / `demo12345`
- Ran focused auth login tests for `admin-console` and `api`
- Ran focused lint checks for the updated seed and auth test files

## [2026-03-29 02:21]
Branch: fix/api-tenant-service-json-types
Commit: fix api deploy build for tenant organization unit metadata (validated: GitHub Actions failure reproduced from logs, focused lint)

Changes:
- Normalize custom organization-unit metadata into Prisma input JSON types before create and update writes
- Keep location-specific metadata handling unchanged while fixing non-location metadata typing for API builds

Validation:
- Reviewed the failing `Build api` GitHub Actions log for run `23702834544`
- Confirmed the failure was `TS2322` in `apps/api/src/services/tenant-service.ts`
- Ran focused ESLint on the updated tenant service file in the hotfix worktree
