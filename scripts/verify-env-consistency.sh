#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"
DB_ENV="$ROOT_DIR/packages/database/.env"
REQUIRE_EB_DEMO="${1:-}"

read_env_value() {
  local file="$1"
  local key="$2"

  if [ ! -f "$file" ]; then
    return 1
  fi

  local line
  line="$(grep -E "^${key}=" "$file" | tail -n 1 || true)"
  if [ -z "$line" ]; then
    return 1
  fi

  line="${line#${key}=}"
  line="${line%\"}"
  line="${line#\"}"
  printf '%s' "$line"
}

ROOT_DATABASE_URL="$(read_env_value "$ROOT_ENV" "DATABASE_URL" || true)"
DB_DATABASE_URL="$(read_env_value "$DB_ENV" "DATABASE_URL" || true)"

if [ -z "$ROOT_DATABASE_URL" ] || [ -z "$DB_DATABASE_URL" ]; then
  echo "Env consistency check failed: missing DATABASE_URL."
  echo "  Root .env value: ${ROOT_DATABASE_URL:-<missing>}"
  echo "  packages/database/.env value: ${DB_DATABASE_URL:-<missing>}"
  echo "  Set DATABASE_URL in both files and retry."
  exit 1
fi

if [ "$ROOT_DATABASE_URL" != "$DB_DATABASE_URL" ]; then
  echo "Env consistency check failed: DATABASE_URL mismatch."
  echo "  Root .env:               $ROOT_DATABASE_URL"
  echo "  packages/database/.env:  $DB_DATABASE_URL"
  echo "  Keep these values identical to avoid cross-tenant demo drift."
  exit 1
fi

if [ "$REQUIRE_EB_DEMO" = "--require-eb-demo" ]; then
  if [[ "$ROOT_DATABASE_URL" != *"payer_portal_eb_demo"* ]]; then
    echo "Env consistency check failed: E&B demo start requires payer_portal_eb_demo."
    echo "  Current DATABASE_URL: $ROOT_DATABASE_URL"
    exit 1
  fi
fi

echo "Env consistency check passed."
