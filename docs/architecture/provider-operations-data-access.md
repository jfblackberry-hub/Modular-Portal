# Provider Operations Data Access Pattern

## Enforced rule

Provider Operations Widgets are UI-only constructs. They must not:

- connect directly to external systems
- fetch their own source data
- read connector state directly
- parse tenant demo/source payloads directly
- enforce Organization Unit or roll-up policy locally

## Required pattern

All Provider Operations dashboard data must flow through the centralized platform data layer in:

- `apps/portal-web/lib/provider-operations-data.ts`

That layer is responsible for:

- loading provider operations source data through a shared data source
- normalizing data into `ProviderOperationsWidgetContract`
- resolving persona-to-widget visibility
- enforcing active Organization Unit scope
- granting roll-up visibility only for explicitly authorized personas

Widgets render only the normalized contract passed to them by the dashboard composition layer.

## Current POC source

The initial POC uses tenant-configured provider operations data sourced from tenant branding/provider demo configuration. Even in this mode, Widgets do not access that configuration directly. The data layer reads it once, normalizes it, and returns standardized contracts.

## Future evolution

When live integrations are added, the shared provider operations data source should be extended behind the same data layer contract instead of adding widget-specific integration code.

This keeps:

- integration reuse centralized
- Organization Unit enforcement consistent
- persona-based aggregation consistent
- future capability decomposition possible without rewriting widgets
