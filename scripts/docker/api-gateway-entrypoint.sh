#!/usr/bin/env bash
set -euo pipefail

export APP_NAME="${APP_NAME:-api-gateway}"
export NODE_ENV="${NODE_ENV:-production}"

node --input-type=module -e "import { loadApiGatewayConfig } from './packages/config/dist/index.js'; loadApiGatewayConfig();"
node ./scripts/runtime/ensure-prisma-migrations.mjs "$APP_NAME"

exec pnpm --filter @payer-portal/api-gateway start
