# Admin UI Cleanup Plan

## Summary of current UX issues

- The admin experience was split between a modern `/admin/...` route tree and older `/platform`, `/platform-admin`, and `/tenant-admin` pages, creating duplicated layouts and inconsistent interaction patterns.
- The shared admin shell had weak hierarchy: a generic top strip, a bulky left rail, a second route-description band, and inconsistent page headers inside many screens.
- Visual treatment varied widely by page. Some screens used useful cards and data tables, while others looked like placeholders or local-development utilities.
- Placeholder pages were reachable from primary navigation without strong visual disclosure that the workflow was not complete.
- Section cards, headers, and page framing lacked reusable patterns, making spacing and action placement inconsistent across the console.

## Design principles applied

- Treat Admin as a control plane: strong navigation, clear route context, compact utility strip, and content-first work area.
- Reuse the best Provider-portal qualities: cleaner hierarchy, stronger frame, lighter top bar, and consistent surface styling.
- Improve the whole console through shared primitives rather than page-by-page redesign.
- Make incomplete work explicit instead of letting placeholders masquerade as finished functionality.
- Preserve route behavior and working APIs while hardening the presentation layer.

## Major layout and component changes made

### Shared shell and framing

- Refined the global admin shell in `apps/admin-console/components/admin-shell.tsx`.
- Reworked the route-context frame in `apps/admin-console/components/admin-content-router.tsx` to show:
  - role context
  - section context
  - current workspace summary
- Refreshed the top utility header in `apps/admin-console/components/top-header.tsx` with a cleaner command-bar treatment.
- Refreshed the left navigation in `apps/admin-console/components/left-admin-menu.tsx` so it feels more like an operational control rail than a stacked list of cards.

### Shared visual system

- Added a lightweight reusable admin UI layer in `apps/admin-console/components/admin-ui.tsx`:
  - `AdminPageLayout`
  - `AdminActionBar`
  - `AdminStatCard`
  - `AdminEmptyState`
  - `AdminLoadingState`
  - `AdminErrorState`
- Upgraded `apps/admin-console/components/section-card.tsx` to use a more consistent section-header/body pattern with optional action placement.
- Expanded `apps/admin-console/app/globals.css` into a real admin theme with:
  - shared surface styling
  - stronger nav treatment
  - consistent page header styling
  - reusable spacing and hierarchy classes

### Placeholder treatment

- Refactored `apps/admin-console/components/admin-placeholder-page.tsx` to use the shared page layout and an explicit unfinished-state callout so incomplete admin areas are clearly disclosed.

### Page header standardization

- Standardized several top-level platform pages to use `AdminPageLayout`:
  - `apps/admin-console/app/admin/platform/feature-flags/page.tsx`
  - `apps/admin-console/app/admin/platform/metrics/page.tsx`
  - `apps/admin-console/app/admin/platform/roles/page.tsx`
  - `apps/admin-console/app/admin/platform/settings/page.tsx`
  - `apps/admin-console/app/admin/platform/tenants/provisioning/page.tsx`

## Reusable patterns introduced

- Standard admin page header with eyebrow, title, description, meta region, and action region.
- Standardized admin surface/card treatment for sections and info states.
- Route-context banner inside the shell for consistent breadcrumbs and summary text.
- Explicit empty/loading/error presentation primitives for incomplete or loading workspaces.
- Stronger left-nav section treatment suitable for future modular expansion.

## Remaining UX debt

- Many real data-heavy pages still use page-specific spacing and ad hoc table styling instead of shared admin data-table primitives.
- Placeholder pages are now disclosed better, but the nav still exposes incomplete workspaces that should either be built or temporarily hidden.
- Legacy admin pages under `/platform`, `/platform-admin`, and `/tenant-admin` still exist and create maintenance drift.
- Forms across role management, feature flags, provisioning, and tenant settings still need standardized validation, action placement, and success/error messaging patterns.
- The admin shell now looks more production-ready, but some inner workspaces still read as development tools rather than finished operational products.
