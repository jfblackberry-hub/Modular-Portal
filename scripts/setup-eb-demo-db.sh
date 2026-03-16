#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${EB_DEMO_DB_NAME:-payer_portal_eb_demo}"
DB_URL="postgresql://dev:dev@127.0.0.1:5432/${DB_NAME}?schema=public"

cd "$ROOT_DIR"

echo "Ensuring postgres service is running..."
docker compose up -d postgres >/dev/null

for attempt in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U dev -d payer_portal >/dev/null 2>&1; then
    break
  fi
  sleep 1
  if [ "$attempt" -eq 30 ]; then
    echo "Postgres did not become ready in time."
    exit 1
  fi
done

echo "Creating database ${DB_NAME} if missing..."
docker compose exec -T postgres psql -U dev -d postgres -v ON_ERROR_STOP=1 <<SQL >/dev/null
SELECT 'CREATE DATABASE "${DB_NAME}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
SQL

echo "Applying Prisma migrations to ${DB_NAME}..."
DATABASE_URL="$DB_URL" pnpm --filter @payer-portal/database exec prisma migrate deploy

echo "Seeding dedicated E&B walkthrough data..."
DATABASE_URL="$DB_URL" pnpm --filter @payer-portal/database db:seed:eb-demo

echo
echo "E&B demo database is ready."
echo "  DATABASE_URL=${DB_URL}"
echo "  Employer Key (primary): EMP-0316043829906172-001"
echo "  Employer Key (secondary): EMP-0316043829906172-002"
echo "  Primary employee census size: ~12,300"
