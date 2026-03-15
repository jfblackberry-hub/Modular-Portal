# Billing & Enrollment Module

Billing & Enrollment is a separately licensed module in the Modular Portal platform. It follows the same plugin registration, tenant-aware module enablement, shared shell, and audit/event standards used by Member and Provider modules.

## Enterprise Deployment Summary

- Module registration: `plugins/enrollment/src/index.ts` (`id: billing-enrollment`)
- Tenant licensing: `billing_enrollment` in tenant purchased modules
  - Server: `packages/server/src/services/tenantSettingsService.ts`
  - Portal checks: `apps/portal-web/lib/tenant-modules.ts`
  - Route enforcement: `apps/portal-web/middleware.ts`
- Role-based navigation and route guards:
  - Plugin navigation role filters: `apps/portal-web/lib/navigation.ts`
  - Module route role policy: `apps/portal-web/lib/billing-enrollment-access.ts`
  - API role/permission gate: `apps/api/src/routes/billing-enrollment.ts`
- Tenant-scoped module configuration:
  - Server config model and persistence: `packages/server/src/services/tenantSettingsService.ts`
  - Portal variant config model: `apps/portal-web/config/billingEnrollmentModuleConfig.ts`
  - Module config API endpoint: `GET /api/v1/billing-enrollment/module-config`

## Role Model

Supported module roles:

- `member`
- `employer_group_admin`
- `broker`
- `internal_operations`
- `internal_admin`
- `tenant_admin`
- `platform_admin` (plus legacy `platform-admin`)

## Tenant Isolation

- All Billing & Enrollment API requests derive tenant scope from authenticated user context.
- No cross-tenant tenantId override is accepted in Billing & Enrollment routes.
- Tenant branding/config and licensed module checks are applied before rendering module experiences.

## Variant Strategy

Variant-ready module config supports:

- `commercial`
- `medicare`
- `medicaid`
- `employer_group`

Variant config controls feature flags, payment options, autopay behavior, document requirements, support content, and renewal messaging without refactoring core flows.

## Documentation Index

- Route map: `plugins/enrollment/docs/ROUTE_MAP.md`
- Domain model summary: `plugins/enrollment/docs/DOMAIN_MODEL_SUMMARY.md`
- Event catalog: `plugins/enrollment/docs/EVENT_CATALOG.md`
- Audit event catalog: `plugins/enrollment/docs/AUDIT_EVENT_CATALOG.md`
- Integration interface summary: `plugins/enrollment/docs/INTEGRATION_INTERFACE_SUMMARY.md`
