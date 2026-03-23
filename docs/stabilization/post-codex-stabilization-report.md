# Post-Codex Stabilization Report

Date: 2026-03-22

## 1. Build and boot status

### Summary

- Full workspace install completed with `pnpm install`.
- Full workspace typecheck passed with `pnpm typecheck`.
- Full workspace build passed with `pnpm build`.
- Repo lint passed with warnings only via `pnpm lint`.
- Local stack restarted cleanly with `pnpm services:restart`.
- Local service status passed with:
  - `portal-web` running on `3000` and returning HTTP `200`
  - `api` running on `3002` and returning HTTP `200`
  - `admin-console` running on `3003` and returning HTTP `307` at root and HTTP `200` at `/admin`
  - `job-worker` disabled by configuration

### Issues found and resolved

- Fixed stale Next.js runtime artifacts that were causing `portal-web` and `admin-console` to boot with HTTP `500` from missing `.next` chunks and manifests.
- Added shared `.next/types` stabilization so Next app typecheck/build no longer flaps based on whether a previous build has already run.
- Fixed multiple dead imports and stale references that were blocking lint/typecheck.
- Fixed a provider portal runtime/type error in `ProviderMessagesPage` where `module.announcements` was referenced instead of `messagesModule.announcements`.
- Fixed admin and portal production builds that were failing during page-data collection because runtime config validation was executing during `next build`.
- Fixed multiple Next 15 prerender failures caused by `useSearchParams()` in client components without a `Suspense` boundary.

### Pass/fail by app

- `portal-web`: PASS
- `admin-console`: PASS
- `api`: PASS
- `api-gateway`: PASS
- `packages/*` shared builds: PASS
- `job-worker`: NOT EXERCISED LIVE

## 2. Route integrity findings

### Live route probes

- `GET /login` on `portal-web`: HTTP `200`
- `GET /dashboard`: HTTP `307` to auth flow, no fatal error
- `GET /provider/dashboard`: HTTP `307` to auth flow, no fatal error
- `GET /employer`: HTTP `307` to auth flow, no fatal error
- `GET /broker`: HTTP `307` to auth flow, no fatal error
- `GET /individual`: HTTP `307` to auth flow, no fatal error
- `GET /admin`: HTTP `200`
- `GET /admin/platform/connectivity/adapters`: HTTP `200`
- `GET /platform-admin`: HTTP `307` to `/admin/platform/health`
- `GET /tenant-admin` on admin-console: HTTP `307` to `/admin/tenant/configuration`
- `GET /dashboard/billing-enrollment/administration`: HTTP `307` to `/login` when unauthenticated, no fatal error
- `GET /preview/error`: HTTP `200`
- `GET /health` on `portal-web`, `admin-console`, and `api`: HTTP `200`

### Findings

- Canonical admin routing under `/admin` is working.
- Legacy admin aliases are still present and redirect to canonical `/admin/...` paths.
- End-user route trees remain separate from admin route trees.
- No fatal route consolidation regressions were observed in the validated major areas.

## 3. Theming/isolation findings

### Verified

- `admin-console` root layout continues to source its shell tokens from admin-specific color definitions in `apps/admin-console/app/layout.tsx` and `apps/admin-console/lib/colors`.
- `portal-web` continues to use tenant-facing shells and theme tokens separately from admin shell tokens.
- A grep sweep found no admin shell token usage bleeding into `apps/portal-web`.
- Persona preview/session surfaces remain contained inside `admin-console` components under `/admin`.
- Persona window rendering remains iframe-contained in:
  - `apps/admin-console/components/admin-platform/persona-window-container.tsx`
  - `apps/admin-console/components/preview-session-workspace.tsx`

### Observations

- Tenant theme token strings still appear in `admin-console` only inside tenant-configuration UI and placeholder/example CSS text, not as admin shell styling inputs.
- No confirmed architecture violation was found where tenant theming mutates admin shell navigation, admin shell colors, or admin shell layout state.

### Architecture status

- Admin portals remain separate from end-user portals: PASS
- Admin look and feel remains distinct from tenant portals: PASS
- Persona preview capability remains isolated inside admin shell: PASS
- Strict multi-tenant isolation was not intentionally weakened in this stabilization pass: PASS

## 4. Config/runtime findings

### Verified

- Shared runtime config is now the single source of truth for frontend runtime resolution.
- `portal-web` and `admin-console` builds now use a shared prebuild/typecheck helper to stabilize Next type artifacts.
- Strict non-dev runtime config validation remains in `packages/config`.
- Build-time-only relaxation was added through `SKIP_RUNTIME_CONFIG_VALIDATION=1` on Next build scripts so `next build` can complete without weakening actual startup validation.
- Local-only localhost and port defaults remain confined to the shared config layer.

### Hardcoded local-runtime sweep

- No runtime hardcoded `localhost` or fixed-port assumptions were found in app source outside the shared config layer.
- Remaining `localhost` and `127.0.0.1` references are in:
  - shared config local-development fallbacks
  - tests
  - docs/examples

## 5. Remaining blockers

- No blocking compile or boot failures remain for the validated stack.
- `pnpm lint` still reports 20 warnings:
  - mostly `react-hooks/exhaustive-deps`
  - several `@next/next/no-img-element`
- Next build still prints a warning that the Next ESLint plugin is not detected in the flat ESLint config, even though lint/build complete successfully.
- `job-worker` was not started during this pass because it is disabled by local configuration.

## 6. Recommended next actions

- Triage and clear the remaining hook dependency warnings so regression QA output is quieter and less noisy.
- Replace remaining presentational `<img>` usage in app surfaces that are performance-sensitive.
- Add a small automated route smoke suite that probes canonical and legacy alias routes after each build.
- Add a focused admin-shell isolation regression test that asserts no tenant theme variables are applied to `/admin` surfaces.
- If job processing is in QA scope, enable and validate `job-worker` in a follow-up pass.
