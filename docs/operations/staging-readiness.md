# Staging Readiness

## Purpose

Staging should mirror the production service split closely enough to validate:

- `portal-web`
- `admin-console`
- `api`
- `job-worker`
- PostgreSQL
- shared object storage behavior

## Required Environment

### Shared

- `NODE_ENV=staging`
- `PORTAL_PUBLIC_ORIGIN`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN`
- `API_PUBLIC_ORIGIN`
- `API_INTERNAL_ORIGIN`
- `DATABASE_URL`
- `LOG_LEVEL`
- `TRUST_PROXY=true`
- `SECURE_COOKIES=true`

### `portal-web`

- `PORTAL_SESSION_SECRET`
- `NEXT_PUBLIC_PORTAL_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_ADMIN_CONSOLE_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_API_PUBLIC_ORIGIN`

### `admin-console`

- `NEXT_PUBLIC_PORTAL_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_ADMIN_CONSOLE_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_API_PUBLIC_ORIGIN`

### `api`

- `API_AUTH_TOKEN_SECRET`
- `PORTAL_CATALOG_DATABASE_URL` when catalog-backed features are enabled
- storage configuration
- backup configuration if backup jobs are enabled

### `job-worker`

- `DATABASE_URL`
- storage configuration
- backup configuration

## Deployment Assumptions

- HTTPS termination at ALB
- service-to-service traffic uses `API_INTERNAL_ORIGIN`
- shared storage is production-like, even if backed by a non-production bucket
- worker is deployed and running
- scheduled backup configuration is triggered separately from long-running services

## Validation Before Promoting

1. Run smoke tests.
2. Run integration tests.
3. Run release validation.
4. Verify logs, metrics, and queue activity.
5. Verify seeded/demo accounts still function where expected.
