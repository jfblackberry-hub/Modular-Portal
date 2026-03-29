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

## [2026-03-29 03:28]
Branch: branding-issues-in-admin-tenant-config
Commit: restore clinic login flow and tenant logo asset serving (validated: provider tenant repair, portal login, platform admin asset tests)

Changes:
- Remove the demo gate from the real portal login and public auth routes so clinic users can reach sign-in
- Keep provider session routing and tenant module handling aligned to provider-class tenant access
- Add API and portal asset routing support so tenant logo uploads render through a public tenant asset path
- Revalidate and repair the seeded provider tenant user access model used for clinic logins

Validation:
- Verified `dr.lee@northstarmedical.local` authenticates through the portal and loads `/provider/dashboard`
- Ran `pnpm --filter @payer-portal/database db:validate:provider-tenant`
- Ran `pnpm --filter api exec node --test --import tsx test/platform-admin-routes.test.ts`

## [2026-03-29 03:41]
Branch: clinic-tenant-cleanup-and-fix
Commit: audit clinic tenant admin flows and assign roles during user creation (validated: local role-on-create, focused api tests)

Changes:
- Submit selected role IDs during admin user creation so clinic users receive their role in the initial create request
- Assign tenant-scoped roles atomically in the API and mark tenant-admin memberships during create when applicable
- Add regression coverage for platform-admin and tenant-admin role-on-create flows
- Update safe admin-console clinic-facing labels from provider wording to clinic wording in tenant settings and licensing screens

Validation:
- Verified locally that admin-created clinic users retain the selected role immediately after creation
- Ran `pnpm --filter api exec node --test --import tsx test/tenant-admin-routes.test.ts test/platform-admin-routes.test.ts`

## [2026-03-29 04:43]
Branch: clinic-tenant-cleanup-and-fix
Commit: reset clinic tenants to a clean Apara baseline and repair clinic login access (validated: Chris and Joe clinic login, focused auth tests)

Changes:
- Removed the hardcoded provider-tenant seed and deploy path and replaced it with a generic clinic reset flow
- Retired legacy clinic tenants and created one clean active `Apara Autism Services` clinic tenant
- Tightened clinic login catalog filtering so inactive clinics and clinic users without tenant-scoped role access do not appear
- Repaired carried clinic-user reset behavior to provision credentials and baseline clinic access roles
- Fixed Chris Gallagher local clinic login state and restored base clinic dashboard permissions for clinic roles

Validation:
- Verified Chris Gallagher can enter the clinic portal from `http://localhost:3000/login`
- Verified Joe Frank clinic login still works
- Ran `pnpm --filter api exec node --test --import tsx test/auth-login-routes.test.ts`

## [2026-03-29 05:16]
Branch: clinic-tenant-cleanup-and-fix
Commit: align active tenant management with live clinic branding and logo resolution (validated: local Apara branding refresh, focused api tests)

Changes:
- Filter inactive, archived, and deleted tenants out of active admin tenant management views
- Route provider and preview clinic logo rendering through the live tenant branding logo before legacy fallbacks
- Update clinic portal branding resolution so the active tenant name and uploaded logo stay aligned

Validation:
- Verified locally that `Apara, Inc.` no longer shows the old Riverside placeholder naming
- Verified the uploaded clinic logo now renders correctly in the frontend clinic portal
- Ran `pnpm --filter api exec node --test --import tsx test/platform-admin-routes.test.ts`
