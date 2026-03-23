#!/usr/bin/env bash
set -euo pipefail

export APP_NAME="${APP_NAME:-api}"
export NODE_ENV="${NODE_ENV:-production}"

node --input-type=module -e "import { loadApiServiceConfig } from './packages/config/dist/index.js'; loadApiServiceConfig();"
node ./scripts/runtime/ensure-prisma-migrations.mjs "$APP_NAME"

exec pnpm --filter api start
