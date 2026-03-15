# Shared Multi-Tenant Admin Model

## Current-State Assessment

The platform uses a shared multi-tenant data model centered on the `Tenant` table, and most tenant-owned records already carry `tenantId`:

- `User`
- `Notification`
- `ConnectorConfig`
- `IntegrationExecution`
- `Document`
- `AuditLog`
- `FeatureFlag` for tenant-scoped flags
- `EventRecord`
- `Job` for tenant-owned background work

Before this correction pass, the schema was mostly tenant-aware but the application plane was not fully separated:

- tenant-scoped APIs like documents, search, connectors, branding, and tenant-admin settings already enforced `tenantId`
- platform-wide APIs for tenants, users, roles, feature flags, and jobs were not consistently restricted to platform operators
- RBAC distinguished “admin” only through `admin.manage`, not a clear `platform_admin` versus `tenant_admin` hierarchy
- the admin console had a single mixed navigation model instead of explicit platform and tenant planes

## Corrected Model

### Platform Admin Plane

Platform operator functions live under `/platform-admin/*` and are restricted server-side to `platform_admin`:

- `/platform-admin/tenants`
- `/platform-admin/users`
- `/platform-admin/roles`
- `/platform-admin/feature-flags`

These endpoints support cross-tenant operations such as tenant registry management, tenant provisioning, platform RBAC, and shared feature controls.

### Tenant Admin Plane

Tenant administration lives under `/tenant-admin/*` and remains tenant-scoped by default:

- `/tenant-admin` in the admin console
- `/api/tenant-admin/settings`
- `/api/tenant-admin/notification-settings`
- `/api/tenant-admin/users/:userId/roles`

Tenant admins are constrained to `currentUser.tenantId`. Platform admins may explicitly switch tenant context on tenant-admin APIs using `tenant_id`, which is validated server-side.

## Enforcement Points

Tenant isolation is enforced at these layers:

1. Authentication and RBAC
   - `getCurrentUserFromHeaders(...)` resolves the authenticated user
   - `assertPlatformAdmin(...)` restricts cross-tenant routes
   - `assertTenantAdmin(...)` restricts tenant admin routes
   - `resolveTenantScope(...)` enforces tenant scoping and permits platform-admin tenant switching

2. API routes
   - platform routes require `platform_admin`
   - tenant routes derive or validate the tenant context on the server
   - tenant-admin routes reject cross-tenant access unless the caller is a platform admin

3. Service and database access
   - document access filters by `tenantId`
   - search filters by `tenantId`
   - connector listing and mutation filter by `tenantId`
   - audit queries filter by `tenantId`
   - tenant notification settings are stored in tenant-owned config and applied dynamically on notification send/delivery

4. Admin UI
   - platform operator pages call `/platform-admin/*`
   - tenant admin pages call `/api/tenant-admin/*`
   - tenant admins do not receive cross-tenant tenant registries or platform-wide user/role lists through their API surface

## Audit Requirements

Privileged actions are expected to be auditable in tenant context:

- platform-admin actions that operate on a tenant record log against that tenant
- tenant-admin actions log within their tenant scope
- tenant-scoped setting changes, branding changes, connector changes, document access, and job actions already emit audit entries

If impersonation or support-session access is added later, it must create explicit audit records containing:

- acting platform admin user
- target tenant
- target user, if applicable
- reason for impersonation/support access
- start and end timestamps

## Remaining Architectural Constraints

The data model still uses globally shared `Role` records. That is acceptable for the current architecture because:

- `Role` is a platform-level definition
- tenant isolation is enforced through `User.tenantId`
- tenant-admin role assignment APIs only allow assigning roles to users inside the caller’s tenant

If tenant-specific role catalogs are required later, add `tenantId` to `Role` and split shared roles from tenant-owned roles explicitly.

## Summary

The enforced two-plane model is now:

- platform admins manage the portal platform from `/platform-admin/*`
- tenant admins manage only their own tenant from `/tenant-admin/*`
- tenant isolation is enforced in route and service logic, not just the frontend
