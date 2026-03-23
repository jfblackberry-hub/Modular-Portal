#!/usr/bin/env bash
set -euo pipefail

export APP_NAME="${APP_NAME:-portal-web}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

node --input-type=module -e "import { loadPortalWebServiceConfig } from './packages/config/dist/index.js'; loadPortalWebServiceConfig();"

exec pnpm --filter portal-web start
