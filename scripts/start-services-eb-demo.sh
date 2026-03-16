#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_NAME="${EB_DEMO_DB_NAME:-payer_portal_eb_demo}"

export DATABASE_URL="postgresql://dev:dev@127.0.0.1:5432/${DB_NAME}?schema=public"

echo "Starting services against E&B demo database:"
echo "  DATABASE_URL=${DATABASE_URL}"

bash "$ROOT_DIR/scripts/verify-env-consistency.sh" --require-eb-demo

bash "$ROOT_DIR/scripts/start-services.sh"
