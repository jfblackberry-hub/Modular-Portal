# Regression Fix Prompts

## Critical

- None in this pass.

## High

### REG-01: Remove tenant admin control plane from `portal-web`

```text
You are working in the Modular Portal repo.

Fix regression REG-01 from docs/qa/regression-pass-01.md.

Problem:
- `portal-web` still hosts an active tenant admin control plane under `/tenant-admin/*`.
- This violates the architecture rule that admin portal experiences must remain fully separate from end-user portals in shell, theme, and navigation.
- Billing-enrollment administration redirects inside `portal-web` still point into `/tenant-admin/*`.

Required outcome:
- Remove active tenant admin control-plane behavior from `portal-web`.
- Preserve architecture isolation: tenant admin workflows must resolve only through `admin-console` canonical `/admin/tenant/...` routes.
- Update any surviving portal-web entry points or redirects so they route to the admin-console tenant admin surface instead of rendering tenant admin UI inside portal-web.
- Do not merge admin and tenant shells.
- Do not reintroduce duplicate route trees.

Scope to inspect first:
- apps/portal-web/app/tenant-admin/*
- apps/portal-web/components/tenant-admin/*
- apps/portal-web/lib/tenant-admin-routes.ts
- apps/portal-web/middleware.ts
- apps/portal-web/app/dashboard/billing-enrollment/administration/*

Deliverables:
- Code changes
- Any needed redirect updates
- Brief summary of what was removed or rerouted
- Validation commands run
```

### REG-04: Stop persona session leakage across browser tabs

```text
You are working in the Modular Portal repo.

Fix regression REG-04 from docs/qa/regression-pass-01.md.

Problem:
- Admin persona session state is persisted in localStorage and is shared across all admin-console browser tabs for the same origin.
- This breaks the intended isolation model for persona/session workspaces and can leak session lists/focus state across tabs.

Required outcome:
- Persona workspace state must no longer leak across browser tabs.
- Support multiple concurrent persona sessions inside one intended admin shell.
- Preserve admin auth separation from persona state.
- Do not weaken audit logging or admin isolation.

Scope to inspect first:
- apps/admin-console/lib/admin-platform-sessions.ts
- apps/admin-console/components/admin-platform/admin-platform-session-manager.tsx
- apps/admin-console/components/admin-platform/admin-platform-shell.tsx

Implementation guidance:
- Prefer tab/session-scoped storage over browser-global storage unless you introduce a proper server-owned session registry.
- Keep existing session manager ergonomics if possible.
- Ensure focused session state and session list are both scoped consistently.

Deliverables:
- Code changes
- Updated behavior summary
- Validation steps for multi-session same-tab vs multi-tab behavior
```

### REG-05: Make `/admin/workspace/[sessionId]` authoritative by `sessionId`

```text
You are working in the Modular Portal repo.

Fix regression REG-05 from docs/qa/regression-pass-01.md.

Problem:
- `/admin/workspace/[sessionId]` currently trusts `tenantId`, `personaType`, and `userId` from URL query parameters.
- The route is not actually bound to an authoritative session record, so the visible session context can be mutated by editing the URL.

Required outcome:
- `sessionId` must become the authoritative lookup key for persona workspace context.
- Query-string edits must not be able to change tenant/persona/user identity for an existing session.
- Preserve support for multiple concurrent persona sessions.
- Keep admin auth separate from persona context.

Scope to inspect first:
- apps/admin-console/app/admin/workspace/[sessionId]/page.tsx
- apps/admin-console/components/admin-platform/admin-platform-session-manager.tsx
- apps/admin-console/lib/admin-platform-sessions.ts
- apps/admin-console/components/admin-platform/admin-persona-workspace.tsx

Implementation guidance:
- Resolve the session record by `sessionId`.
- Reject missing or invalid session ids gracefully.
- Remove or ignore identity-bearing query parameters unless they are strictly non-authoritative.

Deliverables:
- Code changes
- Any new helper utilities
- Validation summary showing that edited query params no longer alter session identity
```

## Medium

### REG-02: Remove legacy admin alias route trees

```text
You are working in the Modular Portal repo.

Fix regression REG-02 from docs/qa/regression-pass-01.md.

Problem:
- Legacy admin aliases `/platform/*`, `/platform-admin/*`, and `/tenant-admin/*` are still active in admin-console as redirect route trees.
- This keeps duplicate route surfaces alive after the `/admin/...` consolidation.

Required outcome:
- Remove legacy route trees unless there is a short-term compatibility requirement that is explicitly documented and narrowly scoped.
- Canonical admin navigation should be `/admin/...` only.
- Do not break valid internal navigation.

Scope to inspect first:
- apps/admin-console/app/platform/*
- apps/admin-console/app/platform-admin/*
- apps/admin-console/app/tenant-admin/*
- apps/admin-console/lib/admin-route-aliases.ts
- any callers still generating legacy admin links

Deliverables:
- Code cleanup
- Redirect strategy, if any remains
- Validation summary showing no broken canonical admin links
```

### REG-03: Make broker lazy workspaces truly data-lazy

```text
You are working in the Modular Portal repo.

Fix regression REG-03 from docs/qa/regression-pass-01.md.

Problem:
- The broker dashboard now uses lazy workspace tabs, but `/broker` still preloads the full broker datasets before first render.
- That defeats the intended lightweight initial render and reduces the benefit of the lazy workspace architecture.

Required outcome:
- Initial broker dashboard render should load only the summary data needed for the landing view.
- Workspace-specific data should load only when the corresponding broker workspace tab is opened.
- Loaded workspace data should be cached appropriately for the current session.
- Avoid duplicating shared lazy workspace logic already used in member/employer flows.

Scope to inspect first:
- apps/portal-web/app/broker/page.tsx
- apps/portal-web/components/billing-enrollment/BrokerCommandCenterDashboard.tsx
- apps/portal-web/components/billing-enrollment/BrokerDashboardWorkspaceSection.tsx
- apps/portal-web/components/shared/portal-action-workspace.tsx
- apps/portal-web/components/shared/dashboard-workspace-cache.ts
- apps/portal-web/lib/dashboard-session-cache.ts

Deliverables:
- Code changes
- Explanation of what moved from eager to lazy loading
- Validation summary for initial load vs first workspace open vs workspace revisit
```
