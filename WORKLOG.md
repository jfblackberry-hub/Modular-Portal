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
