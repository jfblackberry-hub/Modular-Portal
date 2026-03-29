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
