#!/usr/bin/env bash
set -euo pipefail

export APP_NAME="${APP_NAME:-admin-console}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

node --input-type=module -e "import { loadAdminConsoleServiceConfig } from './packages/config/dist/index.js'; loadAdminConsoleServiceConfig();"

exec pnpm --filter admin-console start
