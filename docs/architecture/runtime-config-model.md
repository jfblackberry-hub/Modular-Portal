# Runtime And Config Model

This repository uses a shared runtime model across the local monolith and future split services.

## Service Boundaries

- `portal-web`: end-user portal shell and preview surfaces
- `admin-console`: platform-admin and tenant-admin control planes
- `api`: authenticated application API
- `job-worker`: background jobs worker and the only long-running process that executes queued jobs

## Canonical Ports

- `PORTAL_WEB_PORT`: default `3000`
- `API_PORT`: default `3002`
- `ADMIN_CONSOLE_PORT`: default `3003`
- `POSTGRES_PORT`: default `5432`

## Canonical Origins

- `PORTAL_PUBLIC_ORIGIN`: browser origin for `portal-web`
- `API_PUBLIC_ORIGIN`: browser-facing origin for `api`
- `API_INTERNAL_ORIGIN`: server-to-server origin for `api`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN`: browser origin for `admin-console`

For Next.js browser code, the startup scripts and Docker Compose mirror the public origins into:

- `NEXT_PUBLIC_PORTAL_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_API_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_ADMIN_CONSOLE_PUBLIC_ORIGIN`

## Shared Environment Variables

- `NODE_ENV`
- `HOST`
- `PORT`
- `APP_NAME`
- `DATABASE_URL`
- `PORTAL_CATALOG_DATABASE_URL`
- `PORTAL_SESSION_SECRET`
- `API_AUTH_TOKEN_SECRET`
- `API_GATEWAY_JWT_SECRET`
- `TRUST_PROXY`
- `SECURE_COOKIES`
- `PORTAL_SESSION_COOKIE_DOMAIN`
- `PORTAL_SESSION_COOKIE_SAME_SITE`
- `ALLOW_INSECURE_PUBLIC_ORIGINS`
- `LOG_LEVEL`
- `OTEL_SERVICE_NAME`
- `OTEL_PROMETHEUS_HOST`
- `OTEL_PROMETHEUS_PORT`
- `OTEL_PROMETHEUS_PATH`

## Service Startup Contracts

### `portal-web`

Required outside development/test:

- `PORTAL_PUBLIC_ORIGIN`
- `API_PUBLIC_ORIGIN`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN`
- `PORTAL_SESSION_SECRET`

Security/edge behavior:

- `TRUST_PROXY=true` when running behind ALB or another reverse proxy
- `SECURE_COOKIES=true` outside development/test
- `PORTAL_SESSION_COOKIE_DOMAIN` optional for shared subdomain routing
- `PORTAL_SESSION_COOKIE_SAME_SITE=lax` by default

Entrypoint:

- [portal-web-entrypoint.sh](../../scripts/docker/portal-web-entrypoint.sh)

### `admin-console`

Required outside development/test:

- `PORTAL_PUBLIC_ORIGIN`
- `API_PUBLIC_ORIGIN`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN`

Security/edge behavior:

- `TRUST_PROXY=true` when running behind ALB or another reverse proxy

Entrypoint:

- [admin-console-entrypoint.sh](../../scripts/docker/admin-console-entrypoint.sh)

### `api`

Required in every environment:

- `DATABASE_URL`

Required outside development/test:

- `API_PUBLIC_ORIGIN`
- `API_INTERNAL_ORIGIN`
- `PORTAL_PUBLIC_ORIGIN`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN`
- `API_AUTH_TOKEN_SECRET`

Observability/edge behavior:

- `TRUST_PROXY=true` when running behind ALB
- `LOG_LEVEL=info` default
- `OTEL_PROMETHEUS_HOST=0.0.0.0` for container scraping compatibility

Entrypoint:

- [api-entrypoint.sh](../../scripts/docker/api-entrypoint.sh)

### `job-worker`

Required in every environment:

- `DATABASE_URL`

Optional:

- `JOB_WORKER_POLL_INTERVAL_MS`
- storage configuration
- backup configuration
- `LOG_LEVEL`
- `OTEL_SERVICE_NAME`

Entrypoint:

- [job-worker-entrypoint.sh](../../scripts/docker/job-worker-entrypoint.sh)

The worker owns job execution. Web and admin services may enqueue work through the API, but they must not run job loops.

## Storage

Storage provider selection is controlled by:

- `STORAGE_PROVIDER=local|s3`

Local development and demo defaults:

- `LOCAL_STORAGE_DIR=storage`
- `LOCAL_PUBLIC_ASSET_DIR=apps/portal-web/public/tenant-assets`
- `LOCAL_PUBLIC_ASSET_BASE_PATH=/tenant-assets`
- `BACKUP_STORAGE_DIR=backups`

S3-oriented placeholders:

- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

Selection behavior:

- `local`: runtime storage uses the local adapter for documents, public logos, and backup artifacts
- `s3`: runtime storage uses the S3 adapter; current implementation is config-ready with a stubbed provider for future AWS wiring

Storage profiles:

- default storage: private artifacts such as uploaded documents
- public-assets storage: tenant logos and branding assets that must resolve to browser-safe public URLs
- backup storage: encrypted backup artifacts and manifests

## Validation Rules

- Development and test may fall back to local defaults for ports, origins, and auth secrets.
- Staging and production must set explicit public/internal origins.
- Staging and production must set explicit secrets for:
  - `PORTAL_SESSION_SECRET`
  - `API_AUTH_TOKEN_SECRET`
  - `API_GATEWAY_JWT_SECRET`
- Staging and production default to `SECURE_COOKIES=true` and `TRUST_PROXY=true`.
- Staging and production require HTTPS public origins unless `ALLOW_INSECURE_PUBLIC_ORIGINS=true`.
- API services always require `DATABASE_URL`.

## Observability Baseline

- Structured JSON logs with correlation IDs for API and worker processes
- `x-correlation-id` request/response propagation at the API edge
- Prometheus-compatible `/metrics` endpoint
- OpenTelemetry metrics SDK as the in-process instrumentation baseline
- CloudWatch recommended as the primary AWS sink for logs, alarms, and dashboards

## Local Development Defaults

- `portal-web`: `http://localhost:3000`
- `api`: `http://localhost:3002`
- `admin-console`: `http://localhost:3003`
- `postgres`: `127.0.0.1:5432`

## Runtime Loading

Shared config loading and validation lives in:

- [packages/config/src/index.ts](../../packages/config/src/index.ts)

App wrappers live in:

- [apps/portal-web/lib/public-runtime.ts](../../apps/portal-web/lib/public-runtime.ts)
- [apps/portal-web/lib/server-runtime.ts](../../apps/portal-web/lib/server-runtime.ts)
- [apps/admin-console/lib/public-runtime.ts](../../apps/admin-console/lib/public-runtime.ts)
- [apps/admin-console/lib/server-runtime.ts](../../apps/admin-console/lib/server-runtime.ts)
- [apps/api/src/runtime-config.ts](../../apps/api/src/runtime-config.ts)
- [packages/server/src/jobs/runtime-config.ts](../../packages/server/src/jobs/runtime-config.ts)
