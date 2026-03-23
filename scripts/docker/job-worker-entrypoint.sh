#!/usr/bin/env bash
set -euo pipefail

export APP_NAME="${APP_NAME:-job-worker}"
export NODE_ENV="${NODE_ENV:-production}"

node --input-type=module -e "import { loadJobWorkerServiceConfig } from './packages/config/dist/index.js'; loadJobWorkerServiceConfig();"
node ./scripts/runtime/ensure-prisma-migrations.mjs "$APP_NAME"

exec pnpm --filter @payer-portal/server worker:start
