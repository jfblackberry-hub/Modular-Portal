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
pnpm dev
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
```

### Service Scripts

Start all required local services and validate them:

```bash
pnpm services:start
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

## Root Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm services:restart`
- `pnpm services:status`
- `pnpm typecheck`
- `pnpm test`

These scripts fan out to workspace packages when those packages add matching scripts.

## Docker Compose

The repository includes a local Docker Compose environment for the modular monolith stack:

- Postgres on `localhost:5432`
- Portal web on `localhost:3000`
- API on `localhost:3002`
- Admin console on `localhost:3003`

Postgres credentials:

- Database: `payer_portal`
- User: `dev`
- Password: `dev`

Start the full environment:

```bash
docker compose up --build
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
