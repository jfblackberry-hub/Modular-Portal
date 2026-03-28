# Payer Portal

Base repository for a modular healthcare payer portal platform built as a TypeScript pnpm monorepo.

## Structure

```text
payer-portal/
  apps/
  packages/
  plugins/
  infra/
  docs/
```

## Principles

- Modular monolith
- pnpm workspaces
- TypeScript across the stack
- Minimal shared configuration
- No Kubernetes
- No microservices

## Getting Started

Required runtime:

- Node.js `22.x`
- pnpm `10.x`

```bash
pnpm install
cp .env.example .env
cp .env packages/database/.env
pnpm services:start
```

If you use `nvm`:

```bash
nvm install 22
nvm use 22
```

If Prisma commands fail under a newer Node version, verify:

```bash
node -v
```

It should print a `v22.x.x` version before running:

```bash
pnpm db:migrate
pnpm db:seed
```

## Runtime Model

The repo now uses one shared runtime/config model across `portal-web`, `admin-console`, `api`, and the future-separated `job-worker`.

Canonical local defaults:

- `PORTAL_WEB_PORT=3000`
- `API_PORT=3002`
- `ADMIN_CONSOLE_PORT=3003`
- `POSTGRES_PORT=5432`
- `PORTAL_PUBLIC_ORIGIN=http://localhost:3000`
- `API_PUBLIC_ORIGIN=http://localhost:3002`
- `API_INTERNAL_ORIGIN=http://localhost:3002`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN=http://localhost:3003`

Shared runtime documentation lives in [docs/architecture/runtime-config-model.md](docs/architecture/runtime-config-model.md).

Default local-development logins after seeding:

- Username: `maria` for the mock member portal user
- Username: `tenant` for the tenant admin
- Username: `admin` for the platform admin
- Password: any non-empty value works in local development

### App Scripts

```bash
pnpm dev:portal
pnpm dev:admin
pnpm dev:api
pnpm dev:worker
```

These scripts respect the canonical runtime env contract. If you do not set `PORT`, each app uses its local default:

- `portal-web`: `3000`
- `admin-console`: `3003`
- `api`: `3002`

### Service Scripts

Start all required local services and validate them:

```bash
pnpm services:start
```

Start the same local stack plus the background worker:

```bash
pnpm services:start:with-worker
```

Stop all local portal services and verify they are down:

```bash
pnpm services:stop
```

Check the current service state, ports, and listener PIDs:

```bash
pnpm services:status
```

Restart the full local stack with a clean stop/start cycle:

```bash
pnpm services:restart
```

Default local ports:

- Portal: `http://localhost:3000`
- Admin console: `http://localhost:3003`
- API: `http://localhost:3002`

The service script exports the canonical runtime origins into the Next.js public env variables automatically:

- `NEXT_PUBLIC_PORTAL_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_API_PUBLIC_ORIGIN`
- `NEXT_PUBLIC_ADMIN_CONSOLE_PUBLIC_ORIGIN`

## Root Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm dev:worker`
- `pnpm services:start:with-worker`
- `pnpm services:restart`
- `pnpm services:status`
- `pnpm test:smoke`
- `pnpm test:integration`
- `pnpm validate:release`
- `pnpm typecheck`
- `pnpm test`

These scripts fan out to workspace packages when those packages add matching scripts.

## Docker Compose

The repository includes a Docker Compose environment that follows the same runtime model as the local startup scripts, but packages each runtime as its own deployable service:

- Postgres on `localhost:5432`
- Portal web on `localhost:3000`
- API on `localhost:3002`
- Admin console on `localhost:3003`
- Optional job worker via the `worker` profile

Service Dockerfiles:

- [apps/portal-web/Dockerfile](apps/portal-web/Dockerfile)
- [apps/admin-console/Dockerfile](apps/admin-console/Dockerfile)
- [apps/api/Dockerfile](apps/api/Dockerfile)
- [packages/server/Dockerfile.worker](packages/server/Dockerfile.worker)

Postgres credentials:

- Database: `payer_portal`
- User: `dev`
- Password: `dev`

Start the full environment:

```bash
docker compose up --build
```

Start the full environment plus background worker:

```bash
docker compose --profile worker up --build
```

Run in the background:

```bash
docker compose up --build -d
```

Stop the environment:

```bash
docker compose down
```

Health check example:

```bash
curl http://localhost:3002/health
```

Background jobs are only executed by `job-worker`. `portal-web`, `admin-console`, and `api` do not run job loops.

Backup schedule seeding is intentionally a separate one-shot command so it can be driven by AWS EventBridge or another external scheduler:

```bash
docker compose run --rm job-worker pnpm --filter @payer-portal/server backups:configure
```

## Environment Variables

Core variables:

- `NODE_ENV`
- `HOST`
- `PORT`
- `APP_NAME`
- `DATABASE_URL`
- `PORTAL_CATALOG_DATABASE_URL`
- `PORTAL_SESSION_SECRET`
- `API_AUTH_TOKEN_SECRET`
- `API_GATEWAY_JWT_SECRET`
- `PORTAL_PUBLIC_ORIGIN`
- `API_PUBLIC_ORIGIN`
- `API_INTERNAL_ORIGIN`
- `ADMIN_CONSOLE_PUBLIC_ORIGIN`
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

Validation behavior:

- development and test allow local defaults for ports, origins, and auth secrets
- staging and production require explicit origins and secrets
- staging and production default to secure cookies and trusted proxy handling for ALB-style deployments
- staging and production require HTTPS public origins unless `ALLOW_INSECURE_PUBLIC_ORIGINS=true`
- API startup always requires `DATABASE_URL`

## Observability

Current baseline:

- structured JSON logs from the API and worker paths
- correlation IDs propagated with `x-correlation-id`
- Prometheus-compatible metrics on `/metrics`
- OpenTelemetry metrics SDK as the instrumentation foundation

Recommended AWS deployment path:

- CloudWatch Logs as the primary log sink
- CloudWatch alarms and dashboards for operational alerting
- OpenTelemetry instrumentation retained in-app
- Prometheus scraping kept optional for local diagnostics or future managed collectors

## AWS Scaffold

Deployment placeholders now live under [infra](infra):

- Terraform-style environment stubs for `staging` and `production`
- ECS service module placeholder
- Scheduled task placeholder for backup configuration
- AWS notes describing how `job-worker` and scheduled backup seeding map to ECS/EventBridge

## Staging And Cutover

Operational readiness docs now live under [docs/operations](docs/operations):

- [staging-readiness.md](docs/operations/staging-readiness.md)
- [migration-rehearsal-plan.md](docs/operations/migration-rehearsal-plan.md)
- [production-cutover-runbook.md](docs/operations/production-cutover-runbook.md)
- [rollback-checklist.md](docs/operations/rollback-checklist.md)

Validation scripts:

```bash
pnpm test:smoke
pnpm test:integration
pnpm validate:release
```

## Tenant + Portal Catalog SQL Integration

To onboard a tenant that reads claims, member profile, and provider data from a Docker-hosted SQL catalog:

1. Set the catalog connection string:

```bash
PORTAL_CATALOG_DATABASE_URL="mysql://portal_user:portal_pass@127.0.0.1:3306/portal_catalog"
```

2. Create the tenant from the admin console or `POST /platform-admin/tenants` and include this `brandingConfig` block:

```json
{
  "primaryColor": "#0f6cbd",
  "secondaryColor": "#ffffff",
  "logoUrl": "/logos/example.svg",
  "portalCatalog": {
    "enabled": true,
    "driver": "mysql",
    "databaseUrlEnv": "PORTAL_CATALOG_DATABASE_URL",
    "schema": "public",
    "memberLookup": {
      "mode": "memberNumber",
      "fixedMemberNumber": "M0000001"
    },
    "tables": {
      "users": "members",
      "claims": "claims",
      "providers": "providers"
    },
    "columns": {
      "tenant": "tenantId",
      "userId": "id",
      "userEmail": "email",
      "userFirstName": "firstName",
      "userLastName": "lastName",
      "userDob": "dob",
      "userMemberNumber": "memberNumber",
      "userCreatedAt": "createdAt",
      "userUpdatedAt": "updatedAt",
      "claimMemberEmail": "memberEmail",
      "claimMemberId": "member_id",
      "claimNumber": "claimNumber",
      "claimDate": "claimDate",
      "claimStatus": "status",
      "claimTotalAmount": "totalAmount",
      "claimCreatedAt": "createdAt",
      "claimUpdatedAt": "updatedAt",
      "providerId": "id",
      "providerName": "name",
      "providerNumber": "providerNumber",
      "providerSpecialty": "specialty",
      "providerStatus": "status",
      "providerCreatedAt": "createdAt"
    },
    "joins": {
      "memberPartyTable": "parties",
      "memberPartyIdColumn": "party_id",
      "partyIdColumn": "id",
      "partyFirstNameColumn": "first_name",
      "partyLastNameColumn": "last_name",
      "partyDobColumn": "date_of_birth"
    }
  }
}
```

3. For shared source databases, set `columns.tenant` and optional `tenantValue`. For dedicated per-tenant databases, omit `columns.tenant`.

When enabled, these routes read dynamically from the configured SQL catalog and fall back to local portal DB data if not configured:

- `GET /api/v1/me`
- `GET /api/v1/member/profile`
- `GET /api/v1/member/claims`
- `GET /api/v1/member/providers`
